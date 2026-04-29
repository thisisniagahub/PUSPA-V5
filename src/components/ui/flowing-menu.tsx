'use client'

import React, { useRef, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { ArrowRight, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlowingMenuItemProps {
  label: string
  description: string
  icon: LucideIcon
  onClick: () => void
  color?: string
}

function FlowingMenuItem({ label, description, icon: Icon, onClick, color = "#4B0082" }: FlowingMenuItemProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { damping: 20, stiffness: 200 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.15)
    y.set((e.clientY - centerY) * 0.15)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      className="group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border bg-card p-4 transition-all hover:border-purple-300 dark:hover:border-purple-800"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div 
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-purple-700 dark:group-hover:text-purple-400">
            {label}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted transition-all duration-300 group-hover:bg-purple-600 group-hover:text-white group-hover:translate-x-1">
        <ArrowRight className="h-4 w-4" />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.button>
  )
}

export function FlowingMenu({ items }: { items: FlowingMenuItemProps[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => (
        <FlowingMenuItem key={i} {...item} />
      ))}
    </div>
  )
}
