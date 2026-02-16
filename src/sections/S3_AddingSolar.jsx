import { useMemo, useState, useCallback } from 'react'
import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import StickyBeatChart from '../components/StickyBeatChart'
import { getTotalLoad, hours, timeLabels } from '../data/loadProfile'
import { getSolarForSystemSize, getDailyProduction } from '../data/solarProfile'
import { catmullRomPath } from '../utils/catmullRom'
import systemConfig from '../data/systemConfig'
import '../styles/sections/s3.css'

const cfg = systemConfig
const W = 1000, H = 380
const padL = 55, padR = 20, padT = 20, padB = 50
const chartW = W - padL - padR
const chartH = H - padT - padB

export default function S3_AddingSolar() {
  const [activeBeat, setActiveBeat] = useState(0)

  const totalLoad = useMemo(() => getTotalLoad(), [])
  const solar = useMemo(() => getSolarForSystemSize(cfg.system.arrayKw), [])
  const dailySolar = useMemo(() => getDailyProduction(solar), [solar])
  const maxVal = useMemo(() => Math.max(...totalLoad, ...solar) * 1.15, [totalLoad, solar])

  const xPos = useCallback((h) => padL + (h / 23) * chartW, [])
  const yPos = useCallback((val) => padT + chartH - (val / maxVal) * chartH, [maxVal])
  const base = padT + chartH

  const metrics = useMemo(() => {
    const selfConsumption = hours.map(h => Math.min(totalLoad[h], solar[h]))
    const exported = hours.map(h => Math.max(0, solar[h] - totalLoad[h]))
    const gridImport = hours.map(h => Math.max(0, totalLoad[h] - solar[h]))
    const totalSC = selfConsumption.reduce((a, b) => a + b, 0)
    const totalExport = exported.reduce((a, b) => a + b, 0)
    const totalImport = gridImport.reduce((a, b) => a + b, 0)
    const totalUsage = totalLoad.reduce((a, b) => a + b, 0)
    const scPct = Math.round((totalSC / totalUsage) * 100)
    return { selfConsumption, exported, gridImport, totalSC, totalExport, totalImport, scPct }
  }, [totalLoad])

  const loadPts = useMemo(() => hours.map(h => ({ x: xPos(h), y: yPos(totalLoad[h]) })), [xPos, yPos, totalLoad])
  const solarPts = useMemo(() => hours.map(h => ({ x: xPos(h), y: yPos(solar[h]) })), [xPos, yPos])
  const loadCurve = useMemo(() => catmullRomPath(loadPts), [loadPts])
  const solarCurve = useMemo(() => catmullRomPath(solarPts), [solarPts])

  const gridLines = useMemo(() => {
    const lines = []
    for (let i = 0; i <= 5; i++) {
      const val = (maxVal / 5) * (5 - i)
      const y = padT + (chartH / 5) * i
      lines.push({ y, label: `${val.toFixed(1)} kW` })
    }
    return lines
  }, [maxVal])

  const zones = useMemo(() => {
    const sc = [], ex = [], imp = []
    for (let h = 0; h < 23; h++) {
      const x1 = xPos(h), x2 = xPos(h + 1)
      const h2 = h + 1
      const sc1 = metrics.selfConsumption[h], sc2 = metrics.selfConsumption[h2]
      if (sc1 > 0 || sc2 > 0) {
        sc.push(`${x1},${base} ${x1},${yPos(sc1)} ${x2},${yPos(sc2)} ${x2},${base}`)
      }
      const exp1 = metrics.exported[h], exp2 = metrics.exported[h2]
      if (exp1 > 0 || exp2 > 0) {
        const bot1 = totalLoad[h], bot2 = totalLoad[h2]
        const top1 = solar[h], top2 = solar[h2]
        if (top1 > bot1 || top2 > bot2) {
          ex.push(`${x1},${yPos(Math.max(bot1, 0))} ${x1},${yPos(Math.max(top1, bot1))} ${x2},${yPos(Math.max(top2, bot2))} ${x2},${yPos(Math.max(bot2, 0))}`)
        }
      }
      const gi1 = metrics.gridImport[h], gi2 = metrics.gridImport[h2]
      if (gi1 > 0 || gi2 > 0) {
        const bot1 = Math.max(solar[h], 0), bot2 = Math.max(solar[h2], 0)
        const top1 = totalLoad[h], top2 = totalLoad[h2]
        if (top1 > bot1 || top2 > bot2) {
          imp.push(`${x1},${yPos(bot1)} ${x1},${yPos(top1)} ${x2},${yPos(top2)} ${x2},${yPos(bot2)}`)
        }
      }
    }
    return { sc, ex, imp }
  }, [xPos, yPos, base, totalLoad, metrics])

  const highlights = [
    { x1: 5.5, x2: 10, color: 'rgba(245,166,35,0.06)' },
    { x1: 10, x2: 15, color: 'rgba(255,214,10,0.06)' },
    { x1: 15, x2: 23, color: 'rgba(255,69,58,0.05)' },
  ]

  const chartNode = (
    <div className="s3-chart-container">
      <div className="chart-header">
        <div className="chart-title">Your Usage vs Solar Production</div>
        <div className="chart-badges">
          <div className="chart-badge accent">{totalLoad.reduce((a, b) => a + b, 0).toFixed(0)} kWh / day usage</div>
          <div className="chart-badge solar">{cfg.system.arrayKw} kW system</div>
        </div>
      </div>
      <div className="chart-area s3-chart-area">
        <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="gradSelfConsume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#30d158" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#30d158" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="gradExport" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd60a" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ffd60a" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="gradImport" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff453a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ff453a" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridLines.map((gl, i) => (
            <g key={i}>
              <line x1={padL} y1={gl.y} x2={W - padR} y2={gl.y} className="grid-line" />
              <text x={padL - 10} y={gl.y + 3} className="y-label">{gl.label}</text>
            </g>
          ))}
          {hours.filter(h => h % 3 === 0).map(h => (
            <text key={h} x={xPos(h)} y={H - 10} className="time-marker">{timeLabels[h]}</text>
          ))}

          {highlights[activeBeat] && (
            <rect
              x={xPos(highlights[activeBeat].x1)} y={padT}
              width={xPos(highlights[activeBeat].x2) - xPos(highlights[activeBeat].x1)} height={chartH}
              fill={highlights[activeBeat].color} className="s3-highlight"
            />
          )}

          {zones.sc.map((pts, i) => <polygon key={`sc${i}`} points={pts} fill="url(#gradSelfConsume)" />)}
          {zones.ex.map((pts, i) => <polygon key={`ex${i}`} points={pts} fill="url(#gradExport)" />)}
          {zones.imp.map((pts, i) => <polygon key={`im${i}`} points={pts} fill="url(#gradImport)" />)}

          <path d={solarCurve} fill="none" stroke="#f5a623" strokeWidth="2.5" opacity="0.8" />
          <path d={loadCurve} fill="none" stroke="#e000f0" strokeWidth="2.5" opacity="0.7" />

          <text x={xPos(11)} y={yPos(5)} fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="#ffd60a" textAnchor="middle" letterSpacing="2" opacity="0.7">EXPORT</text>
          <text x={xPos(19)} y={yPos(1.8)} fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="#ff453a" textAnchor="middle" letterSpacing="2" opacity="0.7">IMPORTING</text>
        </svg>
      </div>
      <div className="s3-legend">
        <div className="legend-item"><div className="legend-swatch" style={{ background: 'rgba(224,0,240,0.5)' }} />Your Usage</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: 'rgba(245,166,35,0.5)' }} />Solar Production</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: 'rgba(48,209,88,0.2)' }} />Self-consumption</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: 'rgba(255,214,10,0.25)' }} />Exported</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: 'rgba(255,69,58,0.2)' }} />Still Importing</div>
      </div>
    </div>
  )

  const beats = [
    {
      id: 'morning', time: '\u2600\ufe0f Morning \u00b7 6am \u2013 10am', timeClass: 'morning',
      title: 'The sun gets to work',
      content: <span>As the sun rises, your panels start generating. By 9am you&rsquo;re already producing <span className="solar-strong">{solar[9].toFixed(1)} kW</span> &mdash; more than enough to cover your morning load.</span>,
    },
    {
      id: 'midday', time: '\ud83d\udd06 Midday \u00b7 10am \u2013 3pm', timeClass: 'midday',
      title: 'Peak production, minimum usage',
      content: <span>Your system hits <span className="solar-strong">{Math.max(...solar).toFixed(1)} kW</span> at peak &mdash; but you&rsquo;re only using {totalLoad[12].toFixed(1)} kW. That means <span className="yellow-strong">massive exports</span> going to the grid at just ${cfg.tariff.fit.toFixed(2)}/kWh.</span>,
    },
    {
      id: 'evening', time: '\ud83c\udf19 Evening \u00b7 3pm \u2013 11pm', timeClass: 'evening',
      title: 'The sun drops. Your usage spikes.',
      content: <span>Cooking, hot water, lights, EV charging &mdash; <span className="red-strong">{metrics.totalImport.toFixed(1)} kWh</span> of demand hits right as solar fades to zero. You&rsquo;re back on the grid, paying <span className="red-strong">${cfg.tariff.rate.toFixed(2)}/kWh</span> for every watt.</span>,
    },
  ]

  return (
    <div>
      <Hero badge="Section 03 — Adding Solar" title="Here comes" highlightText="the sun" subtitle={`A ${cfg.system.arrayKw} kW solar system produces a wave of free energy every day. Let\u2019s walk through what that looks like \u2014 morning, noon, and night.`} />

      <StickyBeatChart chart={chartNode} beats={beats} activeBeat={activeBeat} onBeatChange={setActiveBeat} />

      <ScrollSection>
        <div className="section-label">Solar Summary</div>
        <div className="s3-stats-row">
          <div className="s3-stat-card"><div className="stat-value solar-color">{dailySolar.toFixed(1)} kWh</div><div className="stat-label">Daily Production</div></div>
          <div className="s3-stat-card"><div className="stat-value green">{metrics.scPct}%</div><div className="stat-label">Self-consumption</div></div>
          <div className="s3-stat-card"><div className="stat-value yellow">{metrics.totalExport.toFixed(1)} kWh</div><div className="stat-label">Exported</div></div>
          <div className="s3-stat-card"><div className="stat-value red">{metrics.totalImport.toFixed(1)} kWh</div><div className="stat-label">Still Importing</div></div>
        </div>
        <div className="s3-insight" style={{ marginTop: 32 }}>
          <div className="insight-icon">&#9888;&#65039;</div>
          <div className="insight-big">{metrics.scPct}% self-use</div>
          <div className="insight-text">Solar alone only covers <strong>{metrics.scPct}% of your usage</strong>. You&rsquo;re still importing <span className="red-strong">{metrics.totalImport.toFixed(1)} kWh</span> every evening.</div>
        </div>
      </ScrollSection>

      <ScrollSection>
        <div className="cta-section">
          <h2>What if you could<br /><span className="highlight">store that energy?</span></h2>
          <p>A battery captures the midday surplus and shifts it to the evening. Let&rsquo;s see the difference.</p>
        </div>
      </ScrollSection>
    </div>
  )
}
