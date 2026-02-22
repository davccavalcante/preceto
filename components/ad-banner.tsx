'use client'

import { fetchAmazonBids, getDesktopApsSlot, getMobileApsSlot, isAmazonTamConfigured, loadAmazonAPS } from '@/lib/ad-amazon-tam'
import { defineGamSlot, getDesktopAdUnitPath, getMobileAdUnitPath, isGamConfigured, loadGPT } from '@/lib/ad-gam'
import { isMetaAnConfigured, loadMetaAudienceNetwork } from '@/lib/ad-meta-an'
import { buildDesktopAdUnit, buildMobileAdUnit, initPrebidAuction, loadPrebid } from '@/lib/ad-prebid'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const DESKTOP_AD_DIV = 'preceto-ad-leaderboard'
const MOBILE_AD_DIV = 'preceto-ad-halfpage'

function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        function check() {
            setIsMobile(window.innerWidth < 768)
        }
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    return isMobile
}

export function AdBanner() {
    const isMobile = useIsMobile()
    const initialized = useRef(false)
    const [adReady, setAdReady] = useState(false)

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        async function initAds() {
            try {
                const loaders: Promise<void>[] = []

                loaders.push(loadPrebid())

                if (isGamConfigured()) {
                    loaders.push(loadGPT())
                }

                if (isAmazonTamConfigured()) {
                    loaders.push(loadAmazonAPS())
                }

                if (isMetaAnConfigured()) {
                    loaders.push(loadMetaAudienceNetwork())
                }

                await Promise.allSettled(loaders)

                const divId = isMobile ? MOBILE_AD_DIV : DESKTOP_AD_DIV

                if (isGamConfigured()) {
                    const adUnitPath = isMobile
                        ? getMobileAdUnitPath()
                        : getDesktopAdUnitPath()
                    const sizes: [number, number][] = isMobile
                        ? [[300, 600]]
                        : [[728, 90]]
                    defineGamSlot(adUnitPath, sizes, divId)
                }

                if (isAmazonTamConfigured()) {
                    const slot = isMobile
                        ? getMobileApsSlot(divId)
                        : getDesktopApsSlot(divId)
                    await fetchAmazonBids([slot])
                }

                const adUnit = isMobile
                    ? buildMobileAdUnit(divId)
                    : buildDesktopAdUnit(divId)

                initPrebidAuction([adUnit])
                setAdReady(true)
            } catch {
                setAdReady(false)
            }
        }

        initAds()
    }, [isMobile])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: adReady ? 1 : 0.4 }}
            transition={{ duration: 0.4 }}
            className="flex w-full items-center justify-center px-4 py-3"
            role="complementary"
            aria-label="Advertisement"
        >
            {/* Desktop: 728x90 Leaderboard */}
            <div
                className="hidden md:flex items-center justify-center"
                style={{ minWidth: 728, minHeight: 90 }}
            >
                <div
                    id={DESKTOP_AD_DIV}
                    className="flex items-center justify-center rounded-lg border border-border bg-preceto-surface overflow-hidden"
                    style={{ width: 728, height: 90 }}
                >
                    {!adReady && (
                        <span className="text-[10px] text-preceto-text-dim font-mono select-none">
                            Ad
                        </span>
                    )}
                </div>
            </div>

            {/* Mobile: 300x600 Half Page */}
            <div
                className="flex md:hidden items-center justify-center"
                style={{ minWidth: 300, minHeight: 600 }}
            >
                <div
                    id={MOBILE_AD_DIV}
                    className="flex items-center justify-center rounded-lg border border-border bg-preceto-surface overflow-hidden"
                    style={{ width: 300, height: 600 }}
                >
                    {!adReady && (
                        <span className="text-[10px] text-preceto-text-dim font-mono select-none">
                            Ad
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
