// ── FILE: frontend/src/hooks/useCountUp.js ──
import { useState, useEffect, useRef } from 'react'

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function useCountUp(target, duration = 1500, decimals = 2) {
  const [value, setValue] = useState(0)
  const prevTarget = useRef(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    const numTarget = Number(target)
    if (typeof numTarget !== 'number' || isNaN(numTarget)) {
      setValue(0)
      return
    }
    const prev = prevTarget.current
    prevTarget.current = numTarget

    if (prev === 0 && numTarget > 0) {
      let startTime = null
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = easeOutExpo(progress)
        setValue(prev + (numTarget - prev) * eased)
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }
      rafRef.current = requestAnimationFrame(animate)
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    } else {
      setValue(numTarget)
    }
  }, [target, duration])

  return typeof value === 'number' && !isNaN(value)
    ? value.toFixed(decimals)
    : '0'
}
