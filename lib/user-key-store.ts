import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

const COOKIE_NAME = 'payload'
const REQUEST_LIMIT = 10

export type PayloadData = {
  userId: string
  keyHash?: string
}

type StoredKeyPayload = {
  iv: string
  tag: string
  value: string
}

type UserRecord = {
  userId: string
  requestCount: number
  createdAt: number
  updatedAt: number
  keyHash?: string
  encryptedKey?: StoredKeyPayload
}

const storageDir = path.join(process.cwd(), '.data', 'user-keys')

function getSecretSeed() {
  return (
    process.env.GEMINI_KEYS ||
    process.env.GEMINI_API_KEYS ||
    process.env.GEMINI_API_KEY ||
    process.env.SUPABASE_JWT_SECRET ||
    ''
  )
}

function getSigningKey() {
  const seed = getSecretSeed()
  if (!seed) {
    throw new Error('Missing secret for payload signing.')
  }
  return createHash('sha256').update(seed).digest()
}

function getCipherKey(userId: string) {
  const seed = getSecretSeed()
  if (!seed) {
    throw new Error('Missing secret for key encryption.')
  }
  return createHash('sha256').update(`${seed}:${userId}`).digest()
}

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url')
}

function fromBase64Url(input: string) {
  return Buffer.from(input, 'base64url')
}

function signPayload(payload: PayloadData) {
  const encoded = toBase64Url(JSON.stringify(payload))
  const signature = createHmac('sha256', getSigningKey())
    .update(encoded)
    .digest('base64url')
  return `${encoded}.${signature}`
}

function verifyPayload(token: string): PayloadData | null {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null
  const expected = createHmac('sha256', getSigningKey())
    .update(encoded)
    .digest('base64url')
  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null
  }
  try {
    const payload = JSON.parse(fromBase64Url(encoded).toString('utf8')) as PayloadData
    if (!payload.userId) return null
    return payload
  } catch {
    return null
  }
}

function buildUserId() {
  return randomUUID()
}

function getRecordPath(userId: string) {
  const hash = createHash('sha256').update(userId).digest('hex')
  return path.join(storageDir, `${hash}.json`)
}

async function readRecord(userId: string): Promise<UserRecord | null> {
  try {
    const filePath = getRecordPath(userId)
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw) as UserRecord
  } catch {
    return null
  }
}

async function writeRecord(record: UserRecord) {
  await fs.mkdir(storageDir, { recursive: true })
  const filePath = getRecordPath(record.userId)
  await fs.writeFile(filePath, JSON.stringify(record), 'utf8')
}

function encryptKey(apiKey: string, userId: string): StoredKeyPayload {
  const key = getCipherKey(userId)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    iv: toBase64Url(iv),
    tag: toBase64Url(tag),
    value: toBase64Url(encrypted),
  }
}

function decryptKey(payload: StoredKeyPayload, userId: string) {
  const key = getCipherKey(userId)
  const decipher = createDecipheriv('aes-256-gcm', key, fromBase64Url(payload.iv))
  decipher.setAuthTag(fromBase64Url(payload.tag))
  const decrypted = Buffer.concat([
    decipher.update(fromBase64Url(payload.value)),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

function hashKey(apiKey: string) {
  return createHash('sha256').update(apiKey).digest('hex')
}

export function getCookieName() {
  return COOKIE_NAME
}

export function getRequestLimit() {
  return REQUEST_LIMIT
}

export function parsePayloadCookie(cookieValue?: string): PayloadData | null {
  if (!cookieValue) return null
  return verifyPayload(cookieValue)
}

export function createPayload(): PayloadData {
  return { userId: buildUserId() }
}

export function encodePayload(payload: PayloadData) {
  return signPayload(payload)
}

export async function getUserRecord(userId: string) {
  const existing = await readRecord(userId)
  if (existing) return existing
  const created: UserRecord = {
    userId,
    requestCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await writeRecord(created)
  return created
}

export async function incrementRequestCount(userId: string) {
  const record = await getUserRecord(userId)
  const updated: UserRecord = {
    ...record,
    requestCount: record.requestCount + 1,
    updatedAt: Date.now(),
  }
  await writeRecord(updated)
  return updated.requestCount
}

export async function storeUserKey(userId: string, apiKey: string) {
  const keyHash = hashKey(apiKey)
  const encryptedKey = encryptKey(apiKey, userId)
  const record = await getUserRecord(userId)
  const updated: UserRecord = {
    ...record,
    keyHash,
    encryptedKey,
    updatedAt: Date.now(),
  }
  await writeRecord(updated)
  return { keyHash }
}

export async function getUserKey(userId: string, keyHash?: string) {
  const record = await readRecord(userId)
  if (!record?.encryptedKey || !record.keyHash) return null
  if (keyHash && record.keyHash !== keyHash) return null
  try {
    return decryptKey(record.encryptedKey, userId)
  } catch {
    return null
  }
}
