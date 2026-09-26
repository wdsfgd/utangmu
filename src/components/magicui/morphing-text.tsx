import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

interface MorphingTextProps {
  texts: string[]
  className?: string
  interval?: number
}

export function MorphingText({
  texts,
  className,
  interval = 3000,
}: MorphingTextProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (texts.length <= 1) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length)
    }, interval)

    return () => clearInterval(timer)
  }, [texts, interval])

  return (
    <div className={cn('relative inline-flex items-center justify-center overflow-hidden', className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={texts[index]}
          initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -14, filter: 'blur(8px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-black"
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
