import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface MeteorsProps {
  number?: number
  className?: string
}

export function Meteors({ number = 16, className }: MeteorsProps) {
  const [meteorStyles, setMeteorStyles] = useState<Array<React.CSSProperties>>([])

  useEffect(() => {
    const styles = Array.from({ length: number }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 1 + 0.2}s`,
      animationDuration: `${Math.floor(Math.random() * 8 + 4)}s`,
    }))
    setMeteorStyles(styles)
  }, [number])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {meteorStyles.map((style, idx) => (
        <span
          key={idx}
          style={style}
          className={cn(
            'absolute h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-[9999px] bg-emerald-400 shadow-[0_0_0_1px_#ffffff10]',
            "before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-emerald-500 before:to-transparent before:content-['']",
            className
          )}
        />
      ))}
    </div>
  )
}
