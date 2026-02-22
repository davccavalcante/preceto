/**
 * Amazon Transparent Ad Marketplace (TAM) - Header Bidding Integration
 *
 * Loads the Amazon Publisher Services (APS) / apstag script and
 * initializes it with the publisher ID from NEXT_PUBLIC_AMAZON_TAM_PUB_ID in .env.
 *
 * Bid Sizes:
 * - Desktop: 728x90 (Leaderboard)
 * - Mobile:  300x600 (Half Page)
 */

const AMAZON_TAM_PUB_ID = process.env.NEXT_PUBLIC_AMAZON_TAM_PUB_ID || ''

let apsLoaded = false

export function isAmazonTamConfigured(): boolean {
    return AMAZON_TAM_PUB_ID.length > 0
}

interface ApsTagSlot {
    slotID: string
    slotName: string
    sizes: [number, number][]
}

interface ApsTag {
    init: (config: { pubID: string; adServer: string; bidTimeout: number }) => void
    fetchBids: (
        config: { slots: ApsTagSlot[] },
        callback: (bids: unknown[]) => void
    ) => void
    setDisplayBids: () => void
}

function getApsTag(): ApsTag | null {
    if (typeof window === 'undefined') return null
    return (window as unknown as { apstag?: ApsTag }).apstag || null
}

export function loadAmazonAPS(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('APS can only be loaded in the browser.'))
            return
        }

        if (apsLoaded && getApsTag()) {
            resolve()
            return
        }

        const existing = document.querySelector('script[src*="apstag"]')
        if (existing) {
            apsLoaded = true
            resolve()
            return
        }

        const script = document.createElement('script')
        script.src = 'https://c.amazon-adsystem.com/aax2/apstag.js'
        script.async = true
        script.onload = () => {
            apsLoaded = true
            const apstag = getApsTag()
            if (apstag && AMAZON_TAM_PUB_ID) {
                apstag.init({
                    pubID: AMAZON_TAM_PUB_ID,
                    adServer: 'googletag',
                    bidTimeout: 2000,
                })
            }
            resolve()
        }
        script.onerror = () => reject(new Error('Failed to load APS script.'))
        document.head.appendChild(script)
    })
}

export function fetchAmazonBids(
    slots: ApsTagSlot[]
): Promise<unknown[]> {
    return new Promise((resolve) => {
        const apstag = getApsTag()
        if (!apstag || !AMAZON_TAM_PUB_ID) {
            resolve([])
            return
        }

        apstag.fetchBids({ slots }, (bids) => {
            apstag.setDisplayBids()
            resolve(bids)
        })
    })
}

export function getDesktopApsSlot(divId: string): ApsTagSlot {
    return {
        slotID: divId,
        slotName: `/${AMAZON_TAM_PUB_ID}/preceto-leaderboard`,
        sizes: [[728, 90]],
    }
}

export function getMobileApsSlot(divId: string): ApsTagSlot {
    return {
        slotID: divId,
        slotName: `/${AMAZON_TAM_PUB_ID}/preceto-halfpage`,
        sizes: [[300, 600]],
    }
}
