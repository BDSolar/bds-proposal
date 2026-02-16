import { useMemo, useState, useCallback, useRef } from 'react'
import { useProposal } from '../context/ProposalContext'
import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import useAnimateOnScroll from '../hooks/useAnimateOnScroll'
import { loadComponents as staticLoadComponents, getTotalLoad, getDailyTotal, hours, timeLabels, timeFull } from '../data/loadProfile'
import { catmullRomPath } from '../utils/catmullRom'
import '../styles/sections/s2.css'

const W = 1000, H = 380
const padL = 55, padR = 20, padT = 20, padB = 50
const chartW = W - padL - padR
const chartH = H - padT - padB

const COMPONENT_META = [
  { key: 'baseLoad', label: 'Base Load', color: '#e000f0' },
  { key: 'hotWater', label: 'Hot Water', color: '#f5a623' },
  { key: 'cooking', label: 'Cooking', color: '#ffd60a' },
  { key: 'evCharging', label: 'EV Charging', color: '#30d158' },
  { key: 'lighting', label: 'Lighting', color: '#a78bfa' },
]

export default function S2_EnergyLife() {
  const { state } = useProposal()
  const { customer } = state
  const er = state.engineResults
  const [hoverHour, setHoverHour] = useState(null)
  const tooltipRef = useRef(null)
  const [chartRef, isChartVisible] = useAnimateOnScroll(0.15)

  const totalLoad = useMemo(() => er ? er.totalLoad : getTotalLoad(), [er])
  const dailyTotal = useMemo(() => er ? er.dailyTotal : getDailyTotal(), [er])

  const loadComponents = useMemo(() => {
    if (!er) return staticLoadComponents
    return COMPONENT_META.map(m => ({ ...m, data: er.loadProfiles[m.key] }))
  }, [er])
  const maxVal = useMemo(() => Math.max(...totalLoad) * 1.15, [totalLoad])

  const xPos = useCallback((h) => padL + (h / 23) * chartW, [])
  const yPos = useCallback((v) => padT + chartH - (v / maxVal) * chartH, [maxVal])

  // Build stacked area paths
  const stackedPaths = useMemo(() => {
    const components = loadComponents
    const paths = []
    const cumulative = new Array(24).fill(0)

    for (let c = 0; c < components.length; c++) {
      const prevCumulative = [...cumulative]
      for (let h = 0; h < 24; h++) {
        cumulative[h] += components[c].data[h]
      }

      // Top curve points
      const topPts = hours.map(h => ({ x: xPos(h), y: yPos(cumulative[h]) }))
      // Bottom curve points (previous cumulative, reversed)
      const botPts = hours.map(h => ({ x: xPos(h), y: yPos(prevCumulative[h]) })).reverse()

      const topPath = catmullRomPath(topPts)
      const botPath = catmullRomPath(botPts)

      // Close area: top curve forward, then bottom curve backward
      const last = topPts[topPts.length - 1]
      const firstBot = botPts[0]
      const areaD = `${topPath} L${last.x},${last.y} L${firstBot.x},${firstBot.y} ${botPath.replace(/^M/, 'L')} Z`

      paths.push({
        key: components[c].key,
        label: components[c].label,
        color: components[c].color,
        areaD,
        strokeD: topPath,
      })
    }
    return paths
  }, [xPos, yPos])

  // Total load curve (top of stack)
  const totalCurvePts = useMemo(() =>
    hours.map(h => ({ x: xPos(h), y: yPos(totalLoad[h]) })),
    [xPos, yPos, totalLoad]
  )
  const totalCurveD = useMemo(() => catmullRomPath(totalCurvePts), [totalCurvePts])

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = []
    const steps = 5
    for (let i = 0; i <= steps; i++) {
      const val = (maxVal / steps) * (steps - i)
      const y = padT + (chartH / steps) * i
      lines.push({ y, label: `${val.toFixed(1)} kW` })
    }
    return lines
  }, [maxVal])

  // 3pm divider
  const dividerX = xPos(15)

  const handleMouseEnter = useCallback((h) => {
    setHoverHour(h)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoverHour(null)
  }, [])

  const rate = parseFloat(customer.tariffRate) || 0.33

  return (
    <div>
      <Hero
        badge="Section 02 — Your Energy Life"
        title="This is how your"
        highlightText="home uses power"
        subtitle="Your energy usage follows a rhythm. Understanding when you use power is the key to designing a system that actually works."
      />

      <ScrollSection>
        <div className="section-label">24-Hour Load Curve</div>
        <div ref={chartRef}>
          <div className="s2-chart-container">
            <div className="chart-header">
              <div className="chart-title">Your Daily Energy Usage</div>
              <div className="chart-badge accent">{dailyTotal.toFixed(1)} kWh / day</div>
            </div>
            <div className="chart-area s2-chart-area">
              <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {gridLines.map((gl, i) => (
                  <g key={i}>
                    <line x1={padL} y1={gl.y} x2={W - padR} y2={gl.y} className="grid-line" />
                    <text x={padL - 10} y={gl.y + 3} className="y-label">{gl.label}</text>
                  </g>
                ))}

                {/* Time labels */}
                {hours.filter(h => h % 3 === 0).map(h => (
                  <text key={h} x={xPos(h)} y={H - 10} className="time-marker">{timeLabels[h]}</text>
                ))}

                {/* 3pm divider */}
                <line x1={dividerX} y1={padT} x2={dividerX} y2={padT + chartH} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 3" />
                <text x={dividerX} y={padT - 6} className="time-marker" style={{ fill: 'var(--text-tertiary)' }}>3pm</text>

                {/* Gradient defs */}
                <defs>
                  {loadComponents.map(c => (
                    <linearGradient key={c.key} id={`grad-${c.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c.color} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={c.color} stopOpacity="0.05" />
                    </linearGradient>
                  ))}
                </defs>

                {/* Stacked areas */}
                {isChartVisible && stackedPaths.map(p => (
                  <g key={p.key} className="s2-area-group">
                    <path d={p.areaD} fill={`url(#grad-${p.key})`} />
                    <path d={p.strokeD} fill="none" stroke={p.color} strokeWidth="1.5" opacity="0.6" />
                  </g>
                ))}

                {/* Total load curve on top */}
                {isChartVisible && (
                  <path d={totalCurveD} fill="none" stroke="#e000f0" strokeWidth="2.5" opacity="0.8" className="s2-load-curve" />
                )}

                {/* Hover zones */}
                {hours.map(h => {
                  const sliceW = chartW / 24
                  const x = padL + h * (chartW / 23) - sliceW / 2
                  return (
                    <rect
                      key={h}
                      x={Math.max(x, padL)}
                      y={padT}
                      width={sliceW}
                      height={chartH}
                      fill="transparent"
                      style={{ cursor: 'crosshair' }}
                      onMouseEnter={() => handleMouseEnter(h)}
                      onMouseLeave={handleMouseLeave}
                    />
                  )
                })}

                {/* Hover indicator */}
                {hoverHour !== null && (
                  <line
                    x1={xPos(hoverHour)} y1={padT}
                    x2={xPos(hoverHour)} y2={padT + chartH}
                    stroke="rgba(255,255,255,0.15)" strokeWidth="1"
                  />
                )}
              </svg>

              {/* Tooltip */}
              {hoverHour !== null && (
                <div
                  className="s2-tooltip active"
                  ref={tooltipRef}
                  style={{
                    left: `${((xPos(hoverHour)) / W) * 100}%`,
                    top: `${((yPos(totalLoad[hoverHour])) / H) * 100 - 5}%`,
                  }}
                >
                  <div className="tooltip-time">{timeFull[hoverHour]}</div>
                  <div className="tooltip-val">{totalLoad[hoverHour].toFixed(1)} kW</div>
                  {loadComponents.map(c => c.data[hoverHour] > 0 && (
                    <div key={c.key} className="tooltip-row">
                      <span className="tooltip-swatch" style={{ background: c.color }} />
                      <span className="tooltip-label">{c.label}</span>
                      <span className="tooltip-val-sm">{c.data[hoverHour].toFixed(1)}</span>
                    </div>
                  ))}
                  <div className="tooltip-cost">${(totalLoad[hoverHour] * rate).toFixed(2)}/hr</div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="s2-legend">
              {loadComponents.map(c => (
                <div key={c.key} className="legend-item">
                  <div className="legend-swatch" style={{ background: c.color }} />
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="s2-stats-row" style={{ marginTop: 32 }}>
          <div className="s2-stat-card">
            <div className="stat-value accent">{dailyTotal.toFixed(1)} kWh</div>
            <div className="stat-label">Daily Usage</div>
          </div>
          <div className="s2-stat-card">
            <div className="stat-value red">{(dailyTotal * rate).toFixed(2)}</div>
            <div className="stat-label">Daily Cost</div>
          </div>
          <div className="s2-stat-card">
            <div className="stat-value yellow">{Math.max(...totalLoad).toFixed(1)} kW</div>
            <div className="stat-label">Peak Demand</div>
          </div>
        </div>
        <div className="s2-insight-inline" style={{ marginTop: 32 }}>
          Your home consumes <strong>{dailyTotal.toFixed(0)} kWh every day</strong>. Most of it happens in the evening &mdash; when the sun isn&rsquo;t shining. That&rsquo;s the mismatch we need to solve.
        </div>
      </ScrollSection>

      {/* CTA */}
      <ScrollSection>
        <div className="cta-section">
          <h2>What if you could<br />capture the <span className="highlight">sun&rsquo;s energy</span>?</h2>
          <p>Let&rsquo;s overlay solar production onto your usage pattern and see what changes.</p>
        </div>
      </ScrollSection>
    </div>
  )
}
