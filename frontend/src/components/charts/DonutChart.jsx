import { useState } from 'react'

const SIZE = 168
const STROKE = 24
const RADIUS = (SIZE - STROKE) / 2
const GAP = 1.2 // small visual gap between slices, in percent of the ring

// Donut with a centre label and a legend. `slices` is [{ label, value, color }].
// `format` formats a slice value (money or a count); `centerLabel` names the total.
// With `tooltip`, the centre always shows the total and hovering a segment opens a tooltip
// (name, amount, percentage) next to the pointer. Without it, the centre shows the hovered slice.
export default function DonutChart({ slices, format, centerLabel, centerValue, ariaLabel, tooltip = false }) {
  const [active, setActive] = useState(null)
  const [pointer, setPointer] = useState(null) // { x, y } inside the ring, only while over a segment
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const shown = !tooltip && active !== null ? slices[active] : null

  const clear = () => {
    setActive(null)
    setPointer(null)
  }
  const track = (i) => (e) => {
    const box = e.currentTarget.ownerSVGElement.getBoundingClientRect()
    setActive(i)
    setPointer({ x: e.clientX - box.left, y: e.clientY - box.top })
  }

  let offset = 0
  const arcs = slices.map((s) => {
    const percent = (s.value / total) * 100
    const arc = { ...s, percent, start: offset }
    offset += percent
    return arc
  })

  return (
    <div className="donut">
      <div className="donut-ring" onPointerLeave={clear}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={ariaLabel}>
          <circle className="donut-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {arcs.map((a, i) => {
              const length = arcs.length > 1 ? Math.max(a.percent - GAP, 0.1) : a.percent
              return (
                <circle
                  key={a.label}
                  className={`donut-arc${active !== null && active !== i ? ' dim' : ''}`}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  strokeWidth={STROKE}
                  stroke={a.color}
                  pathLength="100"
                  strokeDasharray={`${length} ${100 - length}`}
                  strokeDashoffset={-a.start}
                  style={{ animationDelay: `${i * 90}ms` }}
                  onPointerEnter={tooltip ? track(i) : () => setActive(i)}
                  onPointerMove={tooltip ? track(i) : undefined}
                />
              )
            })}
          </g>
        </svg>
        <div className="donut-center" aria-hidden="true">
          <strong>{shown ? format(shown.value) : centerValue}</strong>
          <span>{shown ? shown.label : centerLabel}</span>
        </div>

        {tooltip && active !== null && pointer && (
          <div className="chart-tooltip" style={{ left: pointer.x, top: pointer.y }}>
            <strong>{arcs[active].label}</strong>
            <span>
              {format(arcs[active].value)} · {Math.round(arcs[active].percent)}%
            </span>
          </div>
        )}
      </div>

      <ul className="chart-legend">
        {arcs.map((a, i) => (
          <li
            key={a.label}
            className={active === i ? 'active' : ''}
            onPointerEnter={() => {
              setPointer(null)
              setActive(i)
            }}
            onPointerLeave={clear}
          >
            <span className="legend-dot" style={{ background: a.color }} />
            <span className="legend-label">{a.label}</span>
            <span className="legend-value">{format(a.value)}</span>
            <span className="legend-percent">{Math.round(a.percent)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
