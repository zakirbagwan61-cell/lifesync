import { useState } from 'react'
import useChartWidth from './useChartWidth'
import { niceScale } from './chartUtils'

const HEIGHT = 232
const PAD = { top: 16, right: 12, bottom: 30, left: 32 }
const SERIES = [
  { key: 'completed', label: 'Completed', color: 'var(--chart-1)' },
  { key: 'pending', label: 'Pending', color: 'var(--chart-2)' },
]

// Grouped bars: completed vs pending per month. `data` is [{ label, full, completed, pending }].
export default function BarChart({ data, ariaLabel }) {
  const [ref, width] = useChartWidth()
  const [active, setActive] = useState(null)

  const innerW = Math.max(width - PAD.left - PAD.right, 0)
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const max = Math.max(...data.map((d) => Math.max(d.completed, d.pending)))
  const scale = niceScale(max, { integer: true })
  const band = innerW / data.length
  const barWidth = Math.min(22, band * 0.3)
  const y = (v) => PAD.top + innerH - (v / scale.top) * innerH
  const baseline = PAD.top + innerH
  const centerX = (i) => PAD.left + band * i + band / 2

  const tip = active !== null ? data[active] : null

  return (
    <div className="chart-box" ref={ref} onPointerLeave={() => setActive(null)}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={ariaLabel}>
          {scale.values.map((v) => (
            <g key={v}>
              <line className="chart-grid" x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} />
              <text className="chart-tick" x={PAD.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle">
                {v}
              </text>
            </g>
          ))}

          {data.map((d, i) => (
            <g key={d.full}>
              {active === i && (
                <rect className="chart-band" x={PAD.left + band * i + 4} y={PAD.top} width={band - 8} height={innerH} rx="8" />
              )}
              {SERIES.map((s, si) => {
                const value = d[s.key]
                const h = baseline - y(value)
                const bx = centerX(i) + (si === 0 ? -barWidth - 2 : 2)
                return (
                  value > 0 && (
                    <rect
                      key={s.key}
                      className="chart-bar"
                      x={bx}
                      y={y(value)}
                      width={barWidth}
                      height={h}
                      rx="4"
                      fill={s.color}
                      style={{ animationDelay: `${i * 60 + si * 40}ms` }}
                    />
                  )
                )
              })}
              <text className="chart-tick" x={centerX(i)} y={HEIGHT - 8} textAnchor="middle">
                {d.label}
              </text>
              <rect
                x={PAD.left + band * i}
                y={PAD.top}
                width={band}
                height={innerH}
                fill="transparent"
                onPointerEnter={() => setActive(i)}
                onPointerMove={() => setActive(i)}
              />
            </g>
          ))}
        </svg>
      )}

      {tip && (
        <div
          className="chart-tooltip"
          style={{ left: centerX(active), top: y(Math.max(tip.completed, tip.pending)) }}
        >
          <strong>{tip.full}</strong>
          <span>Completed: {tip.completed}</span>
          <span>Pending: {tip.pending}</span>
        </div>
      )}

      <ul className="chart-legend inline">
        {SERIES.map((s) => (
          <li key={s.key}>
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-label">{s.label}</span>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Completed</th>
            <th>Pending</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.full}>
              <th scope="row">{d.full}</th>
              <td>{d.completed}</td>
              <td>{d.pending}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
