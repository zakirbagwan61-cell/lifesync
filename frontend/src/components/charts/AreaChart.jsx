import { useId, useState } from 'react'
import useChartWidth from './useChartWidth'
import { niceScale, formatAxisMoney } from './chartUtils'

const HEIGHT = 232
const PAD = { top: 16, right: 16, bottom: 30, left: 48 }

// Smooth line + soft gradient area. `data` is [{ label, full, value }].
export default function AreaChart({ data, format, ariaLabel, seriesName = 'Amount' }) {
  const [ref, width] = useChartWidth()
  const [active, setActive] = useState(null)
  const gradientId = `area-${useId().replace(/:/g, '')}`

  const innerW = Math.max(width - PAD.left - PAD.right, 0)
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const scale = niceScale(Math.max(...data.map((d) => d.value)))
  const band = innerW / data.length
  const x = (i) => PAD.left + band * i + band / 2
  const y = (v) => PAD.top + innerH - (v / scale.top) * innerH
  const baseline = PAD.top + innerH

  // Gentle S-curves between points: smooth, and never overshoots the data.
  const points = data.map((d, i) => [x(i), y(d.value)])
  const line = points
    .map(([px, py], i) => {
      if (i === 0) return `M ${px} ${py}`
      const [prevX, prevY] = points[i - 1]
      const mid = (prevX + px) / 2
      return `C ${mid} ${prevY}, ${mid} ${py}, ${px} ${py}`
    })
    .join(' ')
  const area = `${line} L ${points[points.length - 1][0]} ${baseline} L ${points[0][0]} ${baseline} Z`

  const tip = active !== null ? data[active] : null

  return (
    <div className="chart-box" ref={ref} onPointerLeave={() => setActive(null)}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={ariaLabel}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {scale.values.map((v) => (
            <g key={v}>
              <line className="chart-grid" x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} />
              <text className="chart-tick" x={PAD.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle">
                {formatAxisMoney(v)}
              </text>
            </g>
          ))}

          {data.map((d, i) => (
            <text key={d.label + i} className="chart-tick" x={x(i)} y={HEIGHT - 8} textAnchor="middle">
              {d.label}
            </text>
          ))}

          <path className="chart-area" d={area} fill={`url(#${gradientId})`} />
          <path className="chart-line" d={line} pathLength="1" />

          {active !== null && (
            <line className="chart-cursor" x1={x(active)} x2={x(active)} y1={PAD.top} y2={baseline} />
          )}

          {data.map((d, i) => (
            <circle
              key={d.label + i}
              className={`chart-dot${active === i ? ' active' : ''}`}
              cx={x(i)}
              cy={y(d.value)}
              r={active === i ? 5 : 3.5}
              style={{ animationDelay: `${300 + i * 70}ms` }}
            />
          ))}

          {data.map((d, i) => (
            <rect
              key={`hit-${i}`}
              x={PAD.left + band * i}
              y={PAD.top}
              width={band}
              height={innerH}
              fill="transparent"
              onPointerEnter={() => setActive(i)}
              onPointerMove={() => setActive(i)}
            />
          ))}
        </svg>
      )}

      {tip && (
        <div className="chart-tooltip" style={{ left: x(active), top: y(tip.value) }}>
          <strong>{tip.full}</strong>
          <span>
            {seriesName}: {format(tip.value)}
          </span>
        </div>
      )}

      {/* Same numbers for screen readers */}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.full}>
              <th scope="row">{d.full}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
