import { useMemo, useEffect, useRef } from 'react'
import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import useAnimateOnScroll from '../hooks/useAnimateOnScroll'
import { project20Years } from '../utils/financialProjection'
import systemConfig from '../data/systemConfig'
import { catmullRomPath } from '../utils/catmullRom'
import '../styles/sections/s6.css'

const W = 1000, H = 400
const padL = 70, padR = 30, padT = 20, padB = 50
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
  const [chartRef, isChartVisible] = useAnimateOnScroll(0.15)

  const cfg = systemConfig
  const projection = useMemo(() => project20Years({
    dailyUsage: cfg.financial.dailyUsage,
    rate: cfg.tariff.rate,
    supply: cfg.tariff.supply,
    fit: cfg.tariff.fit,
    escalation: cfg.tariff.escalation,
    systemCost: cfg.financial.systemCost,
    degradation: cfg.financial.degradation,
    dailySolarProduction: cfg.system.dailyProduction,
    dailyExportKwh: cfg.financial.exportKwhDaily,
  }), [])

  const { data, breakevenYear } = projection
  const maxY = Math.max(...data.map(d => d.gridCumulative)) * 1.05
  const totalSavings = data[data.length - 1].netSavings

  const xPos = (i) => padL + (i / (data.length - 1)) * chartW
  const yPos = (val) => padT + chartH - (val / maxY) * chartH

  const gridPts = useMemo(() => data.map((d, i) => ({ x: xPos(i), y: yPos(d.gridCumulative) })), [data])
  const solarPts = useMemo(() => data.map((d, i) => ({ x: xPos(i), y: yPos(d.solarCumulative) })), [data])
  const gridCurve = useMemo(() => catmullRomPath(gridPts), [gridPts])
  const solarCurve = useMemo(() => catmullRomPath(solarPts), [solarPts])

  // Area fills
  const gridArea = useMemo(() => {
    const last = gridPts[gridPts.length - 1]
    const first = gridPts[0]
    return `${gridCurve} L${last.x},${padT + chartH} L${first.x},${padT + chartH} Z`
  }, [gridCurve, gridPts])

  const solarArea = useMemo(() => {
    const last = solarPts[solarPts.length - 1]
    const first = solarPts[0]
    return `${solarCurve} L${last.x},${padT + chartH} L${first.x},${padT + chartH} Z`
  }, [solarCurve, solarPts])

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = []
    for (let i = 0; i <= 5; i++) {
      const val = (maxY / 5) * (5 - i)
      const y = padT + (chartH / 5) * i
      lines.push({ y, label: `$${(val / 1000).toFixed(0)}k` })
    }
    return lines
  }, [maxY])

  // Break-even position
  const beX = xPos(breakevenYear - 1)

  return (
    <div>
      <Hero badge="Section 06 — The Financial Picture" title="Money" highlightText="over time" subtitle="Your system pays for itself — then keeps saving you money for the next 20 years." />

      <ScrollSection>
        <div className="section-label">20-Year Cumulative Cost</div>
        <div ref={chartRef}>
          <div className="s6-chart-container">
            <div className="chart-header">
              <div className="chart-title">Grid-Only vs Solar + Battery</div>
              <div className="chart-badges">
                <div className="chart-badge" style={{ background: 'rgba(255,69,58,0.1)', color: 'var(--red)' }}>Grid cost</div>
                <div className="chart-badge" style={{ background: 'rgba(48,209,88,0.1)', color: 'var(--green)' }}>System cost</div>
              </div>
            </div>
            <div className="chart-area s6-chart-area">
              <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="s6gradGrid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff453a" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#ff453a" stopOpacity="0.01" />
                  </linearGradient>
                  <linearGradient id="s6gradSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#30d158" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#30d158" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {gridLines.map((gl, i) => (
                  <g key={i}>
                    <line x1={padL} y1={gl.y} x2={W - padR} y2={gl.y} className="grid-line" />
                    <text x={padL - 14} y={gl.y + 3} className="y-label">{gl.label}</text>
                  </g>
                ))}
                {data.filter((_, i) => i % 5 === 0 || i === data.length - 1).map((d, _, arr) => (
                  <text key={d.year} x={xPos(data.indexOf(d))} y={H - 10} className="time-marker">{d.year}</text>
                ))}

                {isChartVisible && (
                  <>
                    <path d={gridArea} fill="url(#s6gradGrid)" />
                    <path d={gridCurve} fill="none" stroke="#ff453a" strokeWidth="2.5" strokeLinecap="round" className="s6-line-animate" />
                    <path d={solarArea} fill="url(#s6gradSolar)" />
                    <path d={solarCurve} fill="none" stroke="#30d158" strokeWidth="2.5" strokeLinecap="round" className="s6-line-animate" style={{ animationDelay: '0.3s' }} />

                    {/* Break-even marker */}
                    <line x1={beX} y1={padT} x2={beX} y2={padT + chartH} stroke="#ffd60a" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
                    <circle cx={beX} cy={yPos(data[breakevenYear - 1]?.gridCumulative || 0)} r="6" fill="#ffd60a" className="s6-pulse" />
                    <text x={beX} y={padT - 8} fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="#ffd60a" textAnchor="middle" letterSpacing="2">BREAK-EVEN &middot; YEAR {breakevenYear}</text>
                  </>
                )}
              </svg>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Stats */}
      <ScrollSection>
        <div className="s6-stats-row">
          <div className="s6-stat-card">
            <div className="stat-value green">${systemConfig.financial.systemCost.toLocaleString()}</div>
            <div className="stat-label">System Investment</div>
          </div>
          <div className="s6-stat-card">
            <div className="stat-value yellow">Year {breakevenYear}</div>
            <div className="stat-label">Simple Payback</div>
          </div>
          <div className="s6-stat-card">
            <div className="stat-value green">${totalSavings.toLocaleString()}</div>
            <div className="stat-label">20-Year Net Savings</div>
          </div>
          <div className="s6-stat-card">
            <div className="stat-value red">${data[data.length - 1].gridCumulative.toLocaleString()}</div>
            <div className="stat-label">Grid Cost Avoided</div>
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
            Instead of paying <span className="red">${data[data.length - 1].gridCumulative.toLocaleString()}</span> to the grid, you invest <span className="green">${systemConfig.financial.systemCost.toLocaleString()}</span> once and save the rest.
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
