/**
 * Meta Audience Network - Header Bidding Integration
 *
 * Loads the Meta Audience Network SDK and configures placements.
 * The placement IDs are read from NEXT_PUBLIC_META_AN_PLACEMENT_ID in .env.
 *
 * Placements:
 * - Desktop: 728x90 (Banner)
 * - Mobile:  300x600 (Interstitial / Half Page)
 */

const META_AN_PLACEMENT_ID = process.env.NEXT_PUBLIC_META_AN_PLACEMENT_ID || ''

let metaAnLoaded = false

export function isMetaAnConfigured(): boolean {
    return META_AN_PLACEMENT_ID.length > 0
}

export function getMetaPlacementId(): string {
    return META_AN_PLACEMENT_ID
}

interface MetaAnAd {
    placementId: string
    format: string
    testmode: boolean
}

interface MetaAudienceNetwork {
    init: (config: { placementId: string }) => void
    loadAd: (ad: MetaAnAd) => void
}

function getMetaAN(): MetaAudienceNetwork | null {
    if (typeof window === 'undefined') return null
    return (window as unknown as { AudienceNetwork?: MetaAudienceNetwork })
        .AudienceNetwork || null
}

export function loadMetaAudienceNetwork(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('Meta AN can only be loaded in the browser.'))
            return
        }

        if (metaAnLoaded && getMetaAN()) {
            resolve()
            return
        }

        const existing = document.querySelector(
            'script[src*="connect.facebook.net"]'
        )
        if (existing) {
            metaAnLoaded = true
            resolve()
            return
        }

        const script = document.createElement('script')
        script.src =
            'https://connect.facebook.net/en_US/sdk/xfbml.ad.js#version=v2.0'
        script.async = true
        script.onload = () => {
            metaAnLoaded = true
            const metaAn = getMetaAN()
            if (metaAn && META_AN_PLACEMENT_ID) {
                metaAn.init({ placementId: META_AN_PLACEMENT_ID })
            }
            resolve()
        }
        script.onerror = () =>
            reject(new Error('Failed to load Meta Audience Network SDK.'))
        document.head.appendChild(script)
    })
}

export function loadMetaAd(
    format: 'banner' | 'interstitial' = 'banner',
    testMode: boolean = false
): void {
    const metaAn = getMetaAN()
    if (!metaAn || !META_AN_PLACEMENT_ID) return

    metaAn.loadAd({
        placementId: META_AN_PLACEMENT_ID,
        format,
        testmode: testMode,
    })
}
