'use client'

import { motion } from 'framer-motion'
import { PrecetoLogo } from './preceto-logo'

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex justify-center px-6 py-5"
    >
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <PrecetoLogo className="h-[72px] w-auto" />
        <h1 className="text-lg font-base text-muted-foreground">
          GenAI-Powered Prompt Engineering & LLM Optimization of your inputs
        </h1>
      </div>
    </motion.header>
  )
}
