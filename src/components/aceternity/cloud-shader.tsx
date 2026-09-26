import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface CloudShaderProps {
  className?: string
  children?: React.ReactNode
}

export function CloudShader({ className, children }: CloudShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    // Aurora / Cloud waves state
    let time = 0
    const orbs = [
      { x: 0.25, y: 0.2, r: 0.45, color: 'rgba(16, 185, 129, 0.12)', vx: 0.0003, vy: 0.0002 },
      { x: 0.75, y: 0.3, r: 0.4, color: 'rgba(6, 182, 212, 0.10)', vx: -0.0002, vy: 0.0003 },
      { x: 0.5, y: 0.8, r: 0.5, color: 'rgba(99, 102, 241, 0.08)', vx: 0.0002, vy: -0.0002 },
      { x: 0.15, y: 0.75, r: 0.35, color: 'rgba(16, 185, 129, 0.09)', vx: -0.0003, vy: 0.0001 },
    ]

    const render = () => {
      time += 0.003
      ctx.clearRect(0, 0, width, height)

      // Background base
      ctx.fillStyle = '#09090b'
      ctx.fillRect(0, 0, width, height)

      // Draw subtle grid lines (Aceternity grid style)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'
      ctx.lineWidth = 1
      const gridSize = 48
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Render fluid glowing cloud/aurora orbs
      for (const orb of orbs) {
        const cx = (orb.x + Math.sin(time + orb.x * 10) * 0.08) * width
        const cy = (orb.y + Math.cos(time + orb.y * 10) * 0.08) * height
        const radius = orb.r * Math.min(width, height)

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        gradient.addColorStop(0, orb.color)
        gradient.addColorStop(0.5, orb.color.replace(/[\d\.]+\)$/, '0.04)'))
        gradient.addColorStop(1, 'rgba(9, 9, 11, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden bg-neutral-950', className)}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
