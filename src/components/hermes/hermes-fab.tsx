'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Flower2 } from 'lucide-react'
import { useHermesStore } from '@/stores/hermes-store'
import { PROVIDERS } from '@/lib/hermes/provider-types'

export function HermesFab() {
  const { isOpen, toggleOpen, messages, providerState, viewMode, setViewMode } = useHermesStore()

  const unseenCount = isOpen
    ? 0
    : messages.filter((m) => m.role === 'assistant').length

  const providerInfo = PROVIDERS[providerState.provider]

  return (
    <motion.button
      onClick={toggleOpen}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-background lg:bottom-8 lg:right-8"
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #6d28d9 100%)',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
      aria-label="Buka PUSPA AI"
    >
      {/* Pulse ring */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full animate-ping bg-violet-400/30" />
      )}

      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.svg
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </motion.svg>
        ) : (
          <motion.div
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <Flower2 className="h-6 w-6 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unread badge */}
      <AnimatePresence>
        {unseenCount > 0 && !isOpen && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm"
          >
            {unseenCount > 9 ? '9+' : unseenCount}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Green online dot indicator */}
      {!isOpen && (
        <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white" />
        </span>
      )}

      {/* Provider indicator */}
      {!isOpen && providerState.provider !== 'zai' && (
        <span className="absolute -bottom-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-background border text-[9px] font-bold shadow-sm">
          {providerInfo.icon}
        </span>
      )}
    </motion.button>
  )
}
