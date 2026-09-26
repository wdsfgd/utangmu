import { useEffect, useRef, useState } from 'react'
import { formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'

interface NumberTickerProps {
  value: number
  className?: string
  formatAsCurrency?: boolean
  duration?: number
}

export function NumberTicker({
  value,
  className,
  formatAsCurrency = true,
  duration = 1000,
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousValueRef = useRef(value)

  useEffect(() => {
    const startValue = previousValueRef.current
    const endValue = value
    if (startValue === endValue) return

    const startTime = performance.now()

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic curve
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (endValue - startValue) * easeProgress)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(updateCounter)
      } else {
        previousValueRef.current = endValue
      }
    }

    requestAnimationFrame(updateCounter)
  }, [value, duration])

  return (
    <span className={cn('inline-block tabular-nums font-bold tracking-tight', className)}>
      {formatAsCurrency ? formatRupiah(displayValue) : displayValue.toLocaleString('id-ID')}
    </span>
  )
}
