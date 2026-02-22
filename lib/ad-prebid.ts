/**
 * Prebid.js Header Bidding Configuration
 *
 * Configures Prebid.js ad units and bidder adapters for:
 * - Google Ad Manager (via googletag integration)
 * - Amazon TAM (via apstag / prebid adapter)
 * - Meta Audience Network (via fan adapter)
 *
 * Uses prebid-universal-creative for rendering winning bids.
 *
 * Ad Sizes:
 * - Desktop: 728x90  (Leaderboard)
 * - Mobile:  300x600 (Half Page)
 */

const PREBID_TIMEOUT = 2000

interface BidRequest {
    bidder: string
    params: Record<string, unknown>
}

interface PrebidAdUnit {
    code: string
    mediaTypes: {
        banner: {
            sizes: [number, number][]
        }
    }
    bids: BidRequest[]
}

interface PrebidJS {
    que: Array<() => void>
    setConfig: (config: Record<string, unknown>) => void
    addAdUnits: (units: PrebidAdUnit[]) => void
    requestBids: (config: { bidsBackHandler: () => void }) => void
    setTargetingForGPTAsync: () => void
}

function getPbjs(): PrebidJS | null {
    if (typeof window === 'undefined') return null
    return (window as unknown as { pbjs?: PrebidJS }).pbjs || null
}

export function loadPrebid(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('Prebid can only be loaded in the browser.'))
            return
        }

        const w = window as unknown as { pbjs?: PrebidJS }
        if (w.pbjs) {
            resolve()
            return
        }

        const existing = document.querySelector('script[src*="prebid"]')
        if (existing) {
            resolve()
            return
        }

        w.pbjs = w.pbjs || ({ que: [] } as unknown as PrebidJS)

        const script = document.createElement('script')
        script.src =
            'https://cdn.jsdelivr.net/npm/prebid.js@latest/dist/not-for-prod/prebid.js'
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Prebid.js'))
        document.head.appendChild(script)
    })
}

export function buildDesktopAdUnit(divId: string): PrebidAdUnit {
    const gamNetworkCode = process.env.NEXT_PUBLIC_GAM_NETWORK_CODE || ''
    const metaPlacementId = process.env.NEXT_PUBLIC_META_AN_PLACEMENT_ID || ''

    const bids: BidRequest[] = []

    if (gamNetworkCode) {
        bids.push({
            bidder: 'appnexus',
            params: { placementId: gamNetworkCode },
        })
    }

    if (metaPlacementId) {
        bids.push({
            bidder: 'audienceNetwork',
            params: { placementId: metaPlacementId },
        })
    }

    return {
        code: divId,
        mediaTypes: {
            banner: {
                sizes: [[728, 90]],
            },
        },
        bids,
    }
}

export function buildMobileAdUnit(divId: string): PrebidAdUnit {
    const gamNetworkCode = process.env.NEXT_PUBLIC_GAM_NETWORK_CODE || ''
    const metaPlacementId = process.env.NEXT_PUBLIC_META_AN_PLACEMENT_ID || ''

    const bids: BidRequest[] = []

    if (gamNetworkCode) {
        bids.push({
            bidder: 'appnexus',
            params: { placementId: gamNetworkCode },
        })
    }

    if (metaPlacementId) {
        bids.push({
            bidder: 'audienceNetwork',
            params: { placementId: metaPlacementId },
        })
    }

    return {
        code: divId,
        mediaTypes: {
            banner: {
                sizes: [[300, 600]],
            },
        },
        bids,
    }
}

export function initPrebidAuction(adUnits: PrebidAdUnit[]): void {
    const pbjs = getPbjs()
    if (!pbjs) return

    pbjs.que.push(() => {
        pbjs.setConfig({
            debug: process.env.NODE_ENV === 'development',
            bidderTimeout: PREBID_TIMEOUT,
            enableSendAllBids: true,
            priceGranularity: 'dense',
            userSync: {
                filterSettings: {
                    iframe: { bidders: '*', filter: 'include' },
                },
                syncsPerBidder: 3,
                syncDelay: 3000,
            },
        })

        pbjs.addAdUnits(adUnits)

        pbjs.requestBids({
            bidsBackHandler: () => {
                pbjs.setTargetingForGPTAsync()

                const w = window as unknown as {
                    googletag?: { cmd: Array<() => void>; pubads: () => { refresh: () => void } }
                }
                if (w.googletag) {
                    w.googletag.cmd.push(() => {
                        w.googletag!.pubads().refresh()
                    })
                }
            },
        })
    })
}
