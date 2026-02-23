import { NextRequest, NextResponse } from 'next/server'
import { createPayload, encodePayload, getCookieName, parsePayloadCookie, storeUserKey } from '@/lib/user-key-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : ''
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required.' },
        { status: 400 }
      )
    }

    const cookieName = getCookieName()
    const incoming = parsePayloadCookie(request.cookies.get(cookieName)?.value)
    const basePayload = incoming ?? createPayload()
    const { keyHash } = await storeUserKey(basePayload.userId, apiKey)
    const payload = { ...basePayload, keyHash }
    const token = encodePayload(payload)

    const response = NextResponse.json({ success: true })
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
    return response
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
