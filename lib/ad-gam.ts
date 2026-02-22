/**
 * Google Ad Manager (GAM / GPT) - Header Bidding Integration
 *
 * Loads the Google Publisher Tag (GPT) script and defines ad slots.
 * The GAM network code is read from NEXT_PUBLIC_GAM_NETWORK_CODE in .env.
 *
 * Ad Units:
 * - Desktop: /networkCode/preceto-leaderboard (728x90)
 * - Mobile:  /networkCode/preceto-halfpage (300x600)
 */

const GAM_NETWORK_CODE = process.env.NEXT_PUBLIC_GAM_NETWORK_CODE || ''

let gptLoaded = false

export function getGamNetworkCode(): string {
    return GAM_NETWORK_CODE
}

export function isGamConfigured(): boolean {
    return GAM_NETWORK_CODE.length > 0
}

export function loadGPT(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('GPT can only be loaded in the browser.'))
            return
        }

        if (gptLoaded) {
            resolve()
            return
        }

        const existing = document.querySelector(
            'script[src*="securepubads.g.doubleclick.net"]'
        )
        if (existing) {
            gptLoaded = true
            resolve()
            return
        }

        const script = document.createElement('script')
        script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js'
        script.async = true
        script.onload = () => {
            gptLoaded = true
            resolve()
        }
        script.onerror = () => reject(new Error('Failed to load GPT script.'))
        document.head.appendChild(script)
    })
}

export function defineGamSlot(
    adUnitPath: string,
    sizes: [number, number][],
    divId: string
): void {
    if (typeof window === 'undefined') return

    const w = window as typeof window & {
        googletag?: {
            cmd: Array<() => void>
            defineSlot: (
                adUnitPath: string,
                sizes: [number, number][],
                divId: string
            ) => { addService: (service: unknown) => void } | null
            pubads: () => unknown
            enableServices: () => void
            display: (divId: string) => void
        }
    }

    if (!w.googletag) {
        w.googletag = {
            cmd: [],
            defineSlot: () => null,
            pubads: () => ({}),
            enableServices: () => undefined,
            display: () => undefined,
        }
    }

    w.googletag.cmd.push(() => {
        const gt = w.googletag
        if (!gt) return
        const slot = gt.defineSlot(adUnitPath, sizes, divId)
        if (slot) {
            slot.addService(gt.pubads())
        }
        gt.enableServices()
        gt.display(divId)
    })
}

export function getDesktopAdUnitPath(): string {
    return `/${GAM_NETWORK_CODE}/preceto-leaderboard`
}

export function getMobileAdUnitPath(): string {
    return `/${GAM_NETWORK_CODE}/preceto-halfpage`
}
