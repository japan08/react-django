// ── FILE: frontend/src/components/ParticleBackground.jsx ──
import { useEffect, useRef } from 'react'

const COLORS = ['#7c3aed', '#ec4899', '#06b6d4', '#a78bfa']
const PARTICLE_COUNT = 80
const REPEL_RADIUS = 120
const MOUSE_INFLUENCE = 0.02

function createParticle(canvas) {
  return {
    x: Math.random() * (canvas?.width ?? window.innerWidth),
    y: Math.random() * (canvas?.height ?? window.innerHeight),
    size: 1 + Math.random() * 2,
    opacity: 0.1 + Math.random() * 0.5,
    speedX: (Math.random() - 0.5) * 0.3,
    speedY: -0.2 - Math.random() * 0.4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }
}

export default function ParticleBackground() {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const mouseRef = useRef({ x: null, y: null })
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let width = window.innerWidth
    let height = window.innerHeight

    const setSize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      if (particlesRef.current.length === 0) {
        particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => createParticle(canvas))
      }
    }

    setSize()
    window.addEventListener('resize', setSize)

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    const loop = () => {
      ctx.clearRect(0, 0, width, height)
      const mouse = mouseRef.current

      particlesRef.current.forEach((p) => {
        p.x += p.speedX
        p.y += p.speedY

        if (mouse.x != null && mouse.y != null) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < REPEL_RADIUS && dist > 0) {
            const force = (REPEL_RADIUS - dist) / REPEL_RADIUS
            p.x += (dx / dist) * force * REPEL_RADIUS * MOUSE_INFLUENCE
            p.y += (dy / dist) * force * REPEL_RADIUS * MOUSE_INFLUENCE
          }
        }

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        if (p.color.startsWith('#')) {
          const r = parseInt(p.color.slice(1, 3), 16)
          const g = parseInt(p.color.slice(3, 5), 16)
          const b = parseInt(p.color.slice(5, 7), 16)
          ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`
        } else {
          ctx.fillStyle = p.color
        }
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(loop)
    }

    animationRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', setSize)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
