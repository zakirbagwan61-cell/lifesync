import { useEffect, useState } from 'react'

// Remembers which statistics have already played their count-up, so the animation
// runs once when the app first loads and not again on later renders or page visits.
const played = new Set()

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Counts from 0 up to `target` once per `key`. Afterwards (or with reduced motion)
// it returns `target` straight away, so later data changes update instantly.
export default function useCountUp(target, key, duration = 800) {
  const skip =
    played.has(key) || prefersReducedMotion() || !Number.isFinite(target) || target === 0
  const [value, setValue] = useState(skip ? target : 0)

  useEffect(() => {
    if (skip) {
      setValue(target)
      return undefined
    }
    let frame
    let start
    const step = (now) => {
      if (start === undefined) start = now
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3)))) // ease-out
      if (progress < 1) frame = requestAnimationFrame(step)
      else played.add(key)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, skip, key, duration])

  return skip ? target : value
}
