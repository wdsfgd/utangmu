import * as React from 'react'
import { cn } from '@/lib/utils'

interface AnimatedListProps {
  className?: string
  children: React.ReactNode
}

export function AnimatedList({ className, children }: AnimatedListProps) {
  const childrenArray = React.Children.toArray(children)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          style={{
            animationDelay: `${index * 60}ms`,
          }}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
        >
          {child}
        </div>
      ))}
    </div>
  )
}
