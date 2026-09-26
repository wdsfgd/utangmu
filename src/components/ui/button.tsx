import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'emerald'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]'

    const variants = {
      default: 'bg-neutral-100 text-neutral-900 shadow hover:bg-neutral-200',
      destructive: 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
      outline: 'border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-200',
      secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700/80',
      ghost: 'hover:bg-neutral-800/60 text-neutral-300 hover:text-neutral-100',
      link: 'text-emerald-400 underline-offset-4 hover:underline',
      emerald: 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 font-semibold',
    }

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-lg px-3 text-xs',
      lg: 'h-11 rounded-xl px-6 text-base',
      icon: 'h-9 w-9 rounded-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
