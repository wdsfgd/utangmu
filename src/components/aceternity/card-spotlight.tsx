import React, { useRef, useState } from 'react'
import { motion, useSpring } from 'motion/react'
import { cn } from '@/lib/utils'

interface CardSpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  spotlightColor?: string
}

export function CardSpotlight({
  children,
  className,
  spotlightColor = 'rgba(16, 185, 129, 0.12)',
  ...props
}: CardSpotlightProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [opacity, setOpacity] = useState(0)

  const mouseX = useSpring(0, { stiffness: 400, damping: 40 })
  const mouseY = useSpring(0, { stiffness: 400, damping: 40 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
    setOpacity(1)
  }

  const handleMouseLeave = () => {
    setOpacity(0)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-neutral-700/80',
        className
      )}
      {...props}
    >
      {/* Interactive cursor spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${mouseX.get()}px ${mouseY.get()}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
