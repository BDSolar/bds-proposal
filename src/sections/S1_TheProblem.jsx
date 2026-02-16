import { useMemo, useEffect, useRef, useCallback } from 'react'
import { useProposal } from '../context/ProposalContext'
import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import useAnimateOnScroll from '../hooks/useAnimateOnScroll'
import systemConfig from '../data/systemConfig'
import '../styles/sections/s1.css'

const ESCALATION = systemConfig.tariff.escalation
const YEARS = 20
const START_YEAR = 2026

function useYearlyData(dailyUsage, tariffRate, supplyCharge) {
  return useMemo(() => {
    const rate = parseFloat(tariffRate) || 0.33
    const usage = parseFloat(dailyUsage) || 30
    const supply = parseFloat(supplyCharge) || 1.69
    const data = []
    let cumulative = 0

    for (let i = 0; i < YEARS; i++) {
      const factor = Math.pow(1 + ESCALATION, i)
      const annual = (usage * rate * factor * 365) + (supply * factor * 365)
      cumulative += annual
      data.push({ year: START_YEAR + i, cost: Math.round(annual), cumulative: Math.round(cumulative) })
    }
    return data
  }, [dailyUsage, tariffRate, supplyCharge])
}

function AnimatedCounter({ target, prefix = '$', duration = 1500 }) {
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
      if (ref.current) {
        ref.current.textContent = prefix + Math.round(target * eased).toLocaleString()
      }
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isVisible, target, prefix, duration])

  return (
    <div ref={counterRef}>
      <span ref={ref}>{prefix}0</span>
    </div>
  )
}

function BarChart({ yearlyData }) {
  const svgRef = useRef(null)
  const tooltipRef = useRef(null)
  const [chartRef, isVisible] = useAnimateOnScroll(0.15)

  const maxCost = Math.max(...yearlyData.map(d => d.cost))
  const W = 1000, H = 340
  const padL = 60, padR = 20, padT = 10, padB = 40
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const barW = chartW / YEARS * 0.6
  const gap = chartW / YEARS

  const handleMouseEnter = useCallback((e, i) => {
    const d = yearlyData[i]
    const tooltip = tooltipRef.current
    if (!tooltip) return
    tooltip.querySelector('.tooltip-year').textContent = d.year
    tooltip.querySelector('.tooltip-amount').textContent = `$${d.cost.toLocaleString()}`
    tooltip.classList.add('active')
    const bar = e.currentTarget
    const container = bar.closest('.chart-area')?.getBoundingClientRect()
    const rect = bar.getBoundingClientRect()
    if (container) {
      tooltip.style.left = (rect.left - container.left + rect.width / 2 - 60) + 'px'
      tooltip.style.top = (rect.top - container.top - 60) + 'px'
    }
  }, [yearlyData])

  const handleMouseLeave = useCallback(() => {
    tooltipRef.current?.classList.remove('active')
  }, [])

  // Grid lines
  const gridLines = []
  for (let i = 0; i <= 5; i++) {
    const y = padT + (chartH / 5) * i
    const val = Math.round(maxCost * (1 - i / 5))
    gridLines.push(
      <g key={`grid-${i}`}>
        <line x1={padL} y1={y} x2={W - padR} y2={y} className="grid-line" />
        <text x={padL - 10} y={y + 3} className="y-label">${(val / 1000).toFixed(1)}k</text>
      </g>
    )
  }

  // Bars
  const bars = yearlyData.map((d, i) => {
    const x = padL + i * gap + (gap - barW) / 2
    const barH = (d.cost / maxCost) * chartH
    const y = padT + chartH - barH
    const ratio = i / (YEARS - 1)
    const r = Math.round(224 + ratio * 31)
    const g = Math.round(0 + ratio * 69)
    const b = Math.round(240 - ratio * 182)

    return (
      <g key={i}>
        <defs>
          <linearGradient id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`rgb(${r},${g},${b})`} />
            <stop offset="100%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <rect
          className={`bar${isVisible ? ' bar-animate' : ''}`}
          x={x} y={y} width={barW} height={barH}
          fill={`url(#bg${i})`}
          style={{ animationDelay: `${i * 0.04}s`, opacity: isVisible ? 1 : 0 }}
          onMouseEnter={e => handleMouseEnter(e, i)}
          onMouseLeave={handleMouseLeave}
        />
        {(i % 5 === 0 || i === YEARS - 1) && (
          <text className="bar-label" x={x + barW / 2} y={H - 8}>{d.year}</text>
        )}
      </g>
    )
  })

  return (
    <div ref={chartRef}>
      <div className="chart-container">
        <div className="chart-header">
          <div className="chart-title">Projected Annual Electricity Costs</div>
          <div className="chart-badge">&#9650; {(ESCALATION * 100).toFixed(1)}% annual escalation</div>
        </div>
        <div className="chart-area">
          <svg ref={svgRef} className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            {gridLines}
            {bars}
          </svg>
          <div className="s1-tooltip" ref={tooltipRef}>
            <div className="tooltip-year"></div>
            <div className="tooltip-amount"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function S1_TheProblem() {
  const { state } = useProposal()
  const { customer } = state

  const dailyUsage = customer.dailyUsage || '30'
  const tariffRate = customer.tariffRate || '0.33'
  const supplyCharge = customer.supplyCharge || '1.69'
  const yearlyData = useYearlyData(dailyUsage, tariffRate, supplyCharge)

  const year1 = yearlyData[0]
  const year20 = yearlyData[YEARS - 1]
  const pctIncrease = Math.round(((year20.cost - year1.cost) / year1.cost) * 100)

  return (
    <div>
      <Hero
        badge="Section 01 — The Problem"
        title="Your electricity bill"
        highlightText="is quietly exploding"
        subtitle="Every year, energy costs climb higher. Here's what that really looks like over the next 20 years."
      />

      {/* Animated Annual Cost Counter */}
      <section className="scroll-section">
        <div className="section-inner visible cost-counter-section">
          <div className="counter-label">Your current annual bill</div>
          <div className="counter-value">
            <AnimatedCounter target={year1.cost} />
          </div>
          <div className="counter-context">
            Based on <strong>{parseFloat(dailyUsage).toFixed(0)} kWh/day</strong> at <strong>${parseFloat(tariffRate).toFixed(2)}/kWh</strong> + supply charges
          </div>
        </div>
      </section>

      {/* Bar Chart */}
      <ScrollSection>
        <div className="section-label">20-Year Projection</div>
        <BarChart yearlyData={yearlyData} />
        <div className="stats-row">
          <div className="s1-stat-card">
            <div className="stat-value">${year1.cost.toLocaleString()}</div>
            <div className="stat-label">Year 1 Bill</div>
          </div>
          <div className="s1-stat-card danger">
            <div className="stat-value">${year20.cost.toLocaleString()}</div>
            <div className="stat-label">Year 20 Bill</div>
          </div>
          <div className="s1-stat-card danger">
            <div className="stat-value">+{pctIncrease}%</div>
            <div className="stat-label">Cost Increase</div>
          </div>
        </div>
      </ScrollSection>

      {/* Cumulative */}
      <section className="scroll-section">
        <div className="section-inner visible cumulative-highlight">
          <p className="lead-text">Over the next 20 years, doing nothing means<br />you&rsquo;ll hand your energy retailer&hellip;</p>
          <div className="cumulative-value">
            <AnimatedCounter target={year20.cumulative} prefix="$" duration={2000} />
          </div>
          <div className="cumulative-sub">Total electricity spend &middot; {START_YEAR}&ndash;{START_YEAR + YEARS - 1}</div>
        </div>
      </section>

      {/* CTA */}
      <ScrollSection>
        <div className="cta-section">
          <h2>What if you could<br />bring that to <span className="highlight">$0?</span></h2>
          <p>Let&rsquo;s see what your home looks like with solar and battery &mdash; and how fast you break even.</p>
        </div>
      </ScrollSection>
    </div>
  )
}
