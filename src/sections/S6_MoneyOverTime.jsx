import { useMemo, useEffect, useRef } from 'react'
import { useProposal } from '../context/ProposalContext'
import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import useAnimateOnScroll from '../hooks/useAnimateOnScroll'
import { project20Years } from '../utils/financialProjection'
import systemConfig from '../data/systemConfig'
import { catmullRomPath } from '../utils/catmullRom'
import '../styles/sections/s6.css'

const W = 1000, H = 500
const padL = 80, padR = 60, padT = 40, padB = 60
const chartW = W - padL - padR
const chartH = H - padT - padB

function AnimatedCounter({ target, prefix = '$', duration = 2000 }) {
  const ref = useRef(null)
  const animated = useRef(false)
  const [counterRef, isVisible] = useAnimateOnScroll(0.3)

  useEffect(() => {
    if (!isVisible || animated.current || !ref.current) return
    animated.current = true
    const start = performance.now()
    function tick(now) {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      if (ref.current) ref.current.textContent = prefix + Math.round(target * eased).toLocaleString()
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isVisible, target, prefix, duration])

  return <div ref={counterRef}><span ref={ref}>{prefix}0</span></div>
}

export default function S6_MoneyOverTime() {
  const { state } = useProposal()
  const er = state.engineResults
  const [chartRef, isChartVisible] = useAnimateOnScroll(0.15)

  const cfg = systemConfig
  const projection = useMemo(() => {
    if (er) {
      const fin = er.financial
      return {
        data: fin.yearlyGridCost.map((gc, i) => ({
          year: fin.startYear + i,
          yearIndex: i + 1,
          gridAnnual: gc,
          gridCumulative: fin.cumulativeGridCost[i],
          solarCumulative: fin.cumulativeGridCost[i] + fin.cumulativeSolarNet[i],
          netSavings: -fin.cumulativeSolarNet[i],
        })),
        breakevenYear: fin.paybackYear,
      }
    }
    return project20Years({
      dailyUsage: cfg.financial.dailyUsage,
      rate: cfg.tariff.rate,
      supply: cfg.tariff.supply,
      fit: cfg.tariff.fit,
      escalation: cfg.tariff.escalation,
      systemCost: cfg.financial.systemCost,
      degradation: cfg.financial.degradation,
      dailySolarProduction: cfg.system.dailyProduction,
      dailyExportKwh: cfg.financial.exportKwhDaily,
    })
  }, [er])

  const { data, breakevenYear } = projection
  const investmentCost = er ? er.financial.systemCost : systemConfig.financial.systemCost
  const totalSavings = er ? er.financial.totalSavings20yr : data[data.length - 1].netSavings

  // Green line: Net Solar Position = -netSavings (starts at ~investmentCost, goes negative)
  const greenData = useMemo(() => data.map(d => -d.netSavings), [data])

  // Y-axis range spans both positive (grid costs) and negative (green line profit)
  const allValues = useMemo(() => [...data.map(d => d.gridCumulative), ...greenData], [data, greenData])
  const rawMax = Math.max(...allValues)
  const rawMin = Math.min(...allValues)
  const yRange = rawMax - rawMin
  const yMax = rawMax + yRange * 0.08
  const yMin = rawMin - yRange * 0.08

  const xPos = (i) => padL + (i / (data.length - 1)) * chartW
  const yPos = (val) => padT + chartH * (1 - (val - yMin) / (yMax - yMin))

  // Curves
  const gridPts = useMemo(() => data.map((d, i) => ({ x: xPos(i), y: yPos(d.gridCumulative) })), [data, yMax, yMin])
  const greenPts = useMemo(() => greenData.map((v, i) => ({ x: xPos(i), y: yPos(v) })), [greenData, yMax, yMin])
  const gridCurve = useMemo(() => catmullRomPath(gridPts), [gridPts])
  const greenCurve = useMemo(() => catmullRomPath(greenPts), [greenPts])

  // Grid lines (5 evenly spaced including negatives)
  const gridLines = useMemo(() => {
    const steps = 5
    const lines = []
    const step = (yMax - yMin) / steps
    for (let i = 0; i <= steps; i++) {
      const val = yMax - step * i
      const y = yPos(val)
      const absK = Math.abs(val / 1000)
      const label = val < -500 ? `-$${absK.toFixed(1)}k` : val > 500 ? `$${absK.toFixed(1)}k` : '$0'
      lines.push({ y, val, label })
    }
    return lines
  }, [yMax, yMin])

  // $0 horizontal line position
  const zeroY = yPos(0)

  // Break-even position
  const beIdx = breakevenYear - 1
  const beX = xPos(beIdx)
  const beY = yPos(data[beIdx]?.gridCumulative || 0)

  // End-of-line labels
  const lastGrid = data[data.length - 1].gridCumulative
  const lastGreen = greenData[greenData.length - 1]
  const lastX = xPos(data.length - 1)

  // ROI
  const roi = Math.round((totalSavings / investmentCost) * 100)

  // X-axis labels
  const xLabels = [
    { i: 0, label: 'Yr 1' },
    { i: 4, label: 'Yr 5' },
    { i: 9, label: 'Yr 10' },
    { i: 14, label: 'Yr 15' },
    { i: data.length - 1, label: `Yr ${data.length}` },
  ]

  return (
    <div>
      <Hero badge="Section 06 — The Financial Picture" title="Money" highlightText="over time" subtitle="Your system pays for itself — then keeps saving you money for the next 20 years." />

      <ScrollSection>
        <div ref={chartRef}>
          <div className="s6-chart-container">
            <div className="s6-chart-title">Cumulative Cost Comparison</div>
            <div className="s6-chart-subtitle">20-YEAR PROJECTION</div>
            <div className="chart-area s6-chart-area">
              <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {gridLines.map((gl, i) => (
                  <g key={i}>
                    <line x1={padL} y1={gl.y} x2={W - padR} y2={gl.y} className="grid-line" />
                    <text x={padL - 14} y={gl.y + 4} className="y-label">{gl.label}</text>
                  </g>
                ))}

                {/* $0 dashed line */}
                {yMin < 0 && (
                  <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="6 4" />
                )}

                {/* X-axis labels */}
                {xLabels.map(({ i, label }) => (
                  <text key={i} x={xPos(i)} y={H - 12} className="time-marker">{label}</text>
                ))}

                {isChartVisible && (
                  <>
                    {/* Red line: Cumulative Grid Spend */}
                    <path d={gridCurve} fill="none" stroke="#ff453a" strokeWidth="2.5" strokeLinecap="round" className="s6-line-animate" />

                    {/* Green line: Net Solar Position */}
                    <path d={greenCurve} fill="none" stroke="#30d158" strokeWidth="2.5" strokeLinecap="round" className="s6-line-animate" style={{ animationDelay: '0.3s' }} />

                    {/* Break-even vertical dashed line */}
                    <line x1={beX} y1={padT} x2={beX} y2={padT + chartH} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="6 4" />

                    {/* Break-even green dot */}
                    <circle cx={beX} cy={beY} r="6" fill="#30d158" className="s6-pulse" />

                    {/* Break-even label pill */}
                    <rect x={beX - 65} y={padT - 4} width="130" height="24" rx="4" fill="rgba(48,209,88,0.15)" stroke="rgba(48,209,88,0.3)" strokeWidth="1" />
                    <text x={beX} y={padT + 12} fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="#30d158" textAnchor="middle" fontWeight="600">Break Even: Year {breakevenYear}</text>

                    {/* End-of-line value labels */}
                    <text x={lastX + 8} y={yPos(lastGrid) + 4} fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#ff453a" fontWeight="700">${(lastGrid / 1000).toFixed(0)}k</text>
                    <text x={lastX + 8} y={yPos(lastGreen) + 4} fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#30d158" fontWeight="700">-${(Math.abs(lastGreen) / 1000).toFixed(0)}k</text>
                  </>
                )}
              </svg>
            </div>

            {/* Legend */}
            <div className="s6-legend">
              <div className="legend-item"><div className="legend-swatch" style={{ background: '#ff453a' }} />Cumulative Grid Spend (No Solar)</div>
              <div className="legend-item"><div className="legend-swatch" style={{ background: '#30d158' }} />Net Solar Position</div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="s6-stats-row">
          <div className="s6-stat-card">
            <div className="stat-value white">${investmentCost.toLocaleString()}</div>
            <div className="stat-label">System Cost</div>
          </div>
          <div className="s6-stat-card">
            <div className="stat-value accent">Year {breakevenYear}</div>
            <div className="stat-label">Payback</div>
          </div>
          <div className="s6-stat-card">
            <div className="stat-value green">${totalSavings.toLocaleString()}</div>
            <div className="stat-label">20-Year Savings</div>
          </div>
          <div className="s6-stat-card">
            <div className="stat-value accent">{roi}%</div>
            <div className="stat-label">ROI</div>
          </div>
        </div>
      </ScrollSection>

      {/* Savings counter */}
      <section className="scroll-section">
        <div className="section-inner visible s6-savings-section">
          <div className="s6-savings-eyebrow">20-year net savings</div>
          <div className="s6-savings-value">
            <AnimatedCounter target={totalSavings} prefix="$" duration={2000} />
          </div>
          <div className="s6-savings-context">
            Instead of paying <span className="red">${data[data.length - 1].gridCumulative.toLocaleString()}</span> to the grid, you invest <span className="green">${investmentCost.toLocaleString()}</span> once and save the rest.
          </div>
        </div>
      </section>

      <ScrollSection>
        <div className="cta-section">
          <h2>Your system<br /><span className="highlight">pays for itself</span></h2>
          <p>Now let&rsquo;s look at exactly what goes on your roof and in your garage.</p>
        </div>
      </ScrollSection>
    </div>
  )
}
