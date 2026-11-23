import { useLayoutEffect, useRef, useState } from 'react'

// Measures the width of a container so an SVG can be drawn at its real pixel size
// (text stays crisp and readable instead of being scaled down on phones).
export default function useChartWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    setWidth(Math.round(el.clientWidth))
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
