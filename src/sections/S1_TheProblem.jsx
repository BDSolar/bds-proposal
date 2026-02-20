import { useMemo, useEffect, useRef, useCallback } from 'react'
import { useProposal } from '../context/ProposalContext'
import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import useAnimateOnScroll from '../hooks/useAnimateOnScroll'
import systemConfig from '../data/systemConfig'
import TestimonialQuote from '../components/TestimonialQuote'
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
    <div ref={counterRef} aria-live="polite" aria-atomic="true">
      <span ref={ref} role="status">{prefix}0</span>
    </div>
  )
}

function CostChart({ yearlyData }) {
  const tooltipRef = useRef(null)
  const [chartRef, isVisible] = useAnimateOnScroll(0.15)

  // Use cumulative data — creates a steep hockey-stick curve
  const maxVal = yearlyData[YEARS - 1].cumulative
  const W = 1000, H = 580
  const padL = 75, padR = 20, padT = 50, padB = 50
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  const getX = i => padL + (i / (YEARS - 1)) * chartW
  const getY = d => padT + chartH - (d.cumulative / maxVal) * chartH

  // Smooth curve through points (catmull-rom → cubic bezier)
  const points = yearlyData.map((d, i) => ({ x: getX(i), y: getY(d) }))
  let curvePath = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    curvePath += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  const areaPath = `${curvePath} L${points[points.length - 1].x},${padT + chartH} L${points[0].x},${padT + chartH} Z`

  // Grid lines
  const gridLines = []
  for (let i = 0; i <= 4; i++) {
    const y = padT + (chartH / 4) * i
    const val = maxVal * (1 - i / 4)
    gridLines.push(
      <g key={`grid-${i}`}>
        <line x1={padL} y1={y} x2={W - padR} y2={y} className="grid-line" />
        <text x={padL - 12} y={y + 4} className="y-label">${Math.round(val / 1000)}k</text>
      </g>
    )
  }

  // Milestone labels at 5-year increments (font grows with cost)
  const milestones = [0, 4, 9, 14, 19] // years 1, 5, 10, 15, 20
  const baseFontSize = 14
  const maxFontSize = 28

  // Hover dots + milestone labels
  const dots = yearlyData.map((d, i) => {
    const cx = getX(i)
    const cy = getY(d)
    const isMilestone = milestones.includes(i)
    const milestoneIdx = milestones.indexOf(i)
    const fontSize = isMilestone ? baseFontSize + (milestoneIdx / (milestones.length - 1)) * (maxFontSize - baseFontSize) : 0

    return (
      <g key={i}>
        <circle cx={cx} cy={cy} r="20" fill="transparent" className="hover-zone"
          onPointerEnter={(e) => {
            const tooltip = tooltipRef.current
            if (!tooltip) return
            tooltip.querySelector('.tooltip-year').textContent = d.year
            tooltip.querySelector('.tooltip-amount').textContent = `$${d.cumulative.toLocaleString()}`
            tooltip.classList.add('active')
            const container = e.currentTarget.closest('.chart-wrap')?.getBoundingClientRect()
            const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect()
            if (container && svgRect) {
              const scale = svgRect.width / W
              tooltip.style.left = (cx * scale - 60) + 'px'
              tooltip.style.top = (cy * scale - 60) + 'px'
            }
          }}
          onPointerLeave={() => tooltipRef.current?.classList.remove('active')}
          onTouchStart={(e) => {
            e.preventDefault()
            const tooltip = tooltipRef.current
            if (!tooltip) return
            tooltip.querySelector('.tooltip-year').textContent = d.year
            tooltip.querySelector('.tooltip-amount').textContent = `$${d.cumulative.toLocaleString()}`
            tooltip.classList.toggle('active')
            const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect()
            if (svgRect) {
              const scale = svgRect.width / W
              tooltip.style.left = (cx * scale - 60) + 'px'
              tooltip.style.top = (cy * scale - 60) + 'px'
            }
          }}
        />
        <circle cx={cx} cy={cy} r={isMilestone ? 5 : 3} className={`chart-dot${isVisible ? ' visible' : ''}`}
          style={{ transitionDelay: `${1 + i * 0.04}s` }}
        />
        {isMilestone && (
          <>
            <line
              x1={cx} y1={padT} x2={cx} y2={cy}
              className={`milestone-line-dim${isVisible ? ' visible' : ''}`}
              style={{ transitionDelay: `${1 + milestoneIdx * 0.2}s` }}
            />
            <line
              x1={cx} y1={cy} x2={cx} y2={padT + chartH}
              className={`milestone-line-bright${isVisible ? ' visible' : ''}`}
              style={{ transitionDelay: `${1 + milestoneIdx * 0.2}s` }}
            />
            <text
              x={i === YEARS - 1 ? cx - 40 : cx} y={i === YEARS - 1 ? cy - 12 : cy - fontSize - 6}
              className={`milestone-price${isVisible ? ' visible' : ''}`}
              style={{ fontSize: `${fontSize}px`, transitionDelay: `${1.2 + milestoneIdx * 0.2}s`, textAnchor: i === YEARS - 1 ? 'end' : 'middle' }}
            >
              ${Math.round(d.cumulative / 1000)}k
            </text>
          </>
        )}
        {isMilestone && (
          <text className="bar-label" x={cx} y={H - 10}>{d.year}</text>
        )}
      </g>
    )
  })

  return (
    <div ref={chartRef}>
      <div className="chart-wrap">
        <svg className="chart-svg-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cumulative electricity cost projection over 20 years">
          <defs>
            <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff453a" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#e000f0" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#e000f0" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="curveStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e000f0" />
              <stop offset="70%" stopColor="#ff453a" />
              <stop offset="100%" stopColor="#ff6b5a" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {gridLines}
          <path d={areaPath} fill="url(#curveFill)" className={`curve-area${isVisible ? ' visible' : ''}`} />
          <path d={curvePath} fill="none" stroke="url(#curveStroke)" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"
            className={`curve-line${isVisible ? ' visible' : ''}`}
          />
          {dots}
        </svg>
        <div className="s1-tooltip" ref={tooltipRef}>
          <div className="tooltip-year"></div>
          <div className="tooltip-amount"></div>
        </div>
      </div>
      <div className="chart-footnote">
        <span className="chart-footnote-icon">&#9650;</span> {(ESCALATION * 100).toFixed(1)}% annual escalation &middot; Cumulative electricity spend over 20 years
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
        title={customer.firstName ? `${customer.firstName}, your electricity bill` : 'Your electricity bill'}
        highlightText="is quietly exploding"
        subtitle="Every year, energy costs climb higher. Here's what that really looks like over the next 20 years."
      />

      {/* Global Energy Demand */}
      <ScrollSection>
        <div className="section-label">CNN Business &middot; Feb 2026</div>
        <div className="headline-block">
          <div className="certainty-headline">
            <span className="certainty-left">The demand for power</span>
            <span className="certainty-right mag">is driving us off-planet.</span>
          </div>
          <p className="headline-sub">Elon Musk just merged SpaceX and xAI to build data centres in space. The reason? Earth can&rsquo;t keep up.</p>
          <p className="headline-body">
            AI&rsquo;s hunger for electricity is now so extreme that the world&rsquo;s biggest companies are looking beyond Earth for answers. SpaceX has filed to launch up to <strong>1 million satellites</strong> as orbital data centres &mdash; powered entirely by solar energy in space, where panels produce <strong>up to 5&times; more power</strong> than on the ground.
          </p>
          <div className="headline-stats">
            <div className="headline-stat">
              <div className="headline-stat-number">4%</div>
              <div className="headline-stat-label">of US electricity consumed<br />by data centres</div>
            </div>
            <div className="headline-stat">
              <div className="headline-stat-number">3&times;</div>
              <div className="headline-stat-label">projected growth<br />by 2030</div>
            </div>
            <div className="headline-stat">
              <div className="headline-stat-number">267%</div>
              <div className="headline-stat-label">electricity cost increase<br />near data centres</div>
            </div>
          </div>
          <div className="headline-quote">
            <blockquote>&ldquo;Global electricity demand for AI simply cannot be met with terrestrial solutions, even in the near term, without imposing hardship on communities and the environment.&rdquo;</blockquote>
            <cite>&mdash; Elon Musk, SpaceX-xAI Merger Announcement</cite>
          </div>
          <p className="headline-closer">
            The future of energy is <em>solar</em>.<br />Whether it&rsquo;s powering AI in space &mdash; or powering <em>your home</em> right here on the ground.
          </p>
        </div>
      </ScrollSection>

      {/* Animated Annual Cost Counter */}
      <ScrollSection>
        <div className="section-label">Your Current Annual Bill</div>
        <div className="cost-counter-section">
          <div className="counter-value">
            <AnimatedCounter target={year1.cost} />
          </div>
          <div className="counter-context">
            Based on <strong>{parseFloat(dailyUsage).toFixed(0)} kWh/day</strong> at <strong>${parseFloat(tariffRate).toFixed(2)}/kWh</strong> + supply charges
          </div>
        </div>
      </ScrollSection>

      {/* Bar Chart */}
      <ScrollSection>
        <div className="section-label">20-Year Projection</div>
        <CostChart yearlyData={yearlyData} />
        <div className="stats-row">
          <div className="s1-stat-card">
            <div className="stat-value">${year1.cost.toLocaleString()}</div>
            <div className="stat-label">Year 1 Bill</div>
          </div>
          <div className="s1-stat-card warning">
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
      <ScrollSection>
        <div className="section-label">The Real Cost of Doing Nothing</div>
        <div className="cumulative-highlight">
          <p className="lead-text">Over the next 20 years, doing nothing means<br />you&rsquo;ll hand your energy retailer&hellip;</p>
          <div className="cumulative-value">
            <AnimatedCounter target={year20.cumulative} prefix="$" duration={2000} />
          </div>
          <div className="cumulative-sub">Total electricity spend &middot; {START_YEAR}&ndash;{START_YEAR + YEARS - 1}</div>
        </div>
      </ScrollSection>

      <ScrollSection>
        <TestimonialQuote
          quote="I was paying $780 a quarter and it just kept going up. Now I get a $43 credit. I wish I'd done it years ago."
          name="Sarah M."
          location="Bundaberg"
          system="13.3 kW system"
        />
      </ScrollSection>

      {/* CTA */}
      <ScrollSection>
        <div className="cta-section">
          <div className="certainty-headline">
            <span className="certainty-left">What if you could</span>
            <span className="certainty-right mag">bring that to $0?</span>
          </div>
          <p className="certainty-body">
            Let&rsquo;s see what your home looks like with solar and battery &mdash; and how fast you break even.
          </p>
        </div>
      </ScrollSection>
    </div>
  )
}
