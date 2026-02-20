import { useMemo, useState, useCallback } from 'react'
import { useProposal } from '../context/ProposalContext'
import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import StickyBeatChart from '../components/StickyBeatChart'
import { getTotalLoad, hours, timeLabels } from '../data/loadProfile'
import { getSolarForSystemSize } from '../data/solarProfile'
import { catmullRomPath } from '../utils/catmullRom'
import { simulateBattery } from '../utils/batterySimulation'
import systemConfig from '../data/systemConfig'
import '../styles/sections/s4.css'

const W = 1000, H = 380
const padL = 55, padR = 20, padT = 20, padB = 50
const chartW = W - padL - padR
const chartH = H - padT - padB

export default function S4_AddingBattery() {
  const { state } = useProposal()
  const er = state.engineResults
  const cfg = er ? {
    system: { arrayKw: er.system.panels.totalKw },
    tariff: er.assumptions.tariff,
    battery: { usableCapacityKwh: er.system.battery.usableCapacity },
  } : systemConfig
  const [activeBeat, setActiveBeat] = useState(0)

  const totalLoad = useMemo(() => er ? er.totalLoad : getTotalLoad(), [er])
  const solar = useMemo(() => er ? er.solarProduction : getSolarForSystemSize(systemConfig.system.arrayKw), [er])
  const sim = useMemo(() => {
    if (er) {
      return {
        battSOC: er.battery.soc,
        battCharge: er.battery.charge,
        battDischarge: er.battery.discharge,
        gridImport: er.battery.gridImport,
        gridExport: er.battery.gridExport,
        selfConsume: er.battery.selfConsume,
        totalGridImport: er.battery.totalGridImport,
        totalSelfConsume: er.battery.selfConsume.reduce((a, b) => a + b, 0),
        totalBattDischarge: er.battery.totalDischarged,
        selfPoweredPct: er.battery.selfPoweredPct,
      }
    }
    return simulateBattery(totalLoad, solar)
  }, [er, totalLoad, solar])
  const maxVal = useMemo(() => Math.max(...totalLoad, ...solar) * 1.15, [totalLoad, solar])

  const xPos = useCallback((h) => padL + (h / 23) * chartW, [])
  const yPos = useCallback((val) => padT + chartH - (val / maxVal) * chartH, [maxVal])
  const base = padT + chartH

  // Solar-only metrics (for comparison)
  const solarOnlyMetrics = useMemo(() => {
    const gi = hours.map(h => Math.max(0, totalLoad[h] - solar[h]))
    const sc = hours.map(h => Math.min(totalLoad[h], solar[h]))
    const totalGI = gi.reduce((a, b) => a + b, 0)
    const totalSC = sc.reduce((a, b) => a + b, 0)
    const totalUsage = totalLoad.reduce((a, b) => a + b, 0)
    return {
      gridImport: totalGI,
      scPct: Math.round((totalSC / totalUsage) * 100),
      dailyCost: (totalGI * cfg.tariff.rate + cfg.tariff.supply).toFixed(2),
    }
  }, [totalLoad])

  // Curve paths
  const loadPts = useMemo(() => hours.map(h => ({ x: xPos(h), y: yPos(totalLoad[h]) })), [xPos, yPos, totalLoad])
  const solarPts = useMemo(() => hours.map(h => ({ x: xPos(h), y: yPos(solar[h]) })), [xPos, yPos])
  const loadCurve = useMemo(() => catmullRomPath(loadPts), [loadPts])
  const solarCurve = useMemo(() => catmullRomPath(solarPts), [solarPts])

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = []
    for (let i = 0; i <= 5; i++) {
      const val = (maxVal / 5) * (5 - i)
      const y = padT + (chartH / 5) * i
      lines.push({ y, label: `${val.toFixed(1)} kW` })
    }
    return lines
  }, [maxVal])

  // Battery zones
  const batteryZones = useMemo(() => {
    const charge = [], discharge = [], selfConsume = [], gridImp = []
    for (let h = 0; h < 23; h++) {
      const x1 = xPos(h), x2 = xPos(h + 1)
      const h2 = h + 1
      // Charging zones (solar above load, battery absorbing)
      if (sim.battCharge[h] > 0 || sim.battCharge[h2] > 0) {
        const l1 = totalLoad[h], l2 = totalLoad[h2]
        const s1 = solar[h], s2 = solar[h2]
        if (s1 > l1 || s2 > l2) {
          charge.push(`${x1},${yPos(Math.max(l1, 0))} ${x1},${yPos(Math.max(s1, l1))} ${x2},${yPos(Math.max(s2, l2))} ${x2},${yPos(Math.max(l2, 0))}`)
        }
      }
      // Discharge zones
      if (sim.battDischarge[h] > 0 || sim.battDischarge[h2] > 0) {
        const s1 = solar[h], s2 = solar[h2]
        const l1 = totalLoad[h], l2 = totalLoad[h2]
        const bd1 = sim.battDischarge[h], bd2 = sim.battDischarge[h2]
        const bot1 = Math.max(s1, 0), bot2 = Math.max(s2, 0)
        const top1 = Math.min(s1 + bd1, l1), top2 = Math.min(s2 + bd2, l2)
        if (top1 > bot1 || top2 > bot2) {
          discharge.push(`${x1},${yPos(bot1)} ${x1},${yPos(top1)} ${x2},${yPos(top2)} ${x2},${yPos(bot2)}`)
        }
      }
      // Self-consumption
      const sc1 = sim.selfConsume[h], sc2 = sim.selfConsume[h2]
      if (sc1 > 0 || sc2 > 0) {
        selfConsume.push(`${x1},${base} ${x1},${yPos(sc1)} ${x2},${yPos(sc2)} ${x2},${base}`)
      }
      // Grid import
      if (sim.gridImport[h] > 0 || sim.gridImport[h2] > 0) {
        const s1 = solar[h], s2 = solar[h2]
        const bd1 = sim.battDischarge[h], bd2 = sim.battDischarge[h2]
        const l1 = totalLoad[h], l2 = totalLoad[h2]
        const bot1 = Math.max(s1 + bd1, 0), bot2 = Math.max(s2 + bd2, 0)
        if (l1 > bot1 || l2 > bot2) {
          gridImp.push(`${x1},${yPos(bot1)} ${x1},${yPos(l1)} ${x2},${yPos(l2)} ${x2},${yPos(bot2)}`)
        }
      }
    }
    return { charge, discharge, selfConsume, gridImp }
  }, [xPos, yPos, base, totalLoad, sim])

  // SOC mini chart
  const socH = 60
  const socPts = useMemo(() => hours.map(h => ({
    x: xPos(h), y: 10 + (socH - 20) - (sim.battSOC[h] / cfg.battery.usableCapacityKwh) * (socH - 20)
  })), [xPos, sim.battSOC])
  const socCurve = useMemo(() => catmullRomPath(socPts), [socPts])

  const chartNode = (
    <div className="s4-chart-container">
      <div className="chart-header">
        <div className="chart-title">Solar + Battery Performance</div>
        <div className="chart-badges">
          <div className="chart-badge solar">{cfg.system.arrayKw} kW solar</div>
          <div className="chart-badge battery">{cfg.battery.usableCapacityKwh} kWh battery</div>
        </div>
      </div>
      <div className="chart-area s4-chart-area">
        <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Battery charge and discharge cycle over 24 hours">
          <defs>
            <linearGradient id="gradBattCharge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#30d158" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#30d158" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="gradBattDischarge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5ee07a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#5ee07a" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="gradBattSC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#30d158" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#30d158" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="gradBattImport" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff453a" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ff453a" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="gradDaylight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5a623" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f5a623" stopOpacity="0.01" />
            </linearGradient>
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f5a623" stopOpacity="0.15" />
              <stop offset="70%" stopColor="#f5a623" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Daytime highlight band */}
          <rect x={xPos(6)} y={padT} width={xPos(18) - xPos(6)} height={chartH} fill="url(#gradDaylight)" />
          <line x1={xPos(6)} y1={padT} x2={xPos(6)} y2={padT + chartH} stroke="#f5a623" strokeWidth="0.5" opacity="0.15" />
          <line x1={xPos(18)} y1={padT} x2={xPos(18)} y2={padT + chartH} stroke="#f5a623" strokeWidth="0.5" opacity="0.15" />

          {/* Sun icon */}
          <circle cx={xPos(12)} cy={padT + 36} r="28" fill="url(#sunGlow)" />
          <circle cx={xPos(12)} cy={padT + 36} r="8" fill="none" stroke="#f5a623" strokeWidth="1.2" opacity="0.3" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
            const rad = (angle * Math.PI) / 180
            const x1 = xPos(12) + Math.cos(rad) * 12
            const y1 = padT + 36 + Math.sin(rad) * 12
            const x2 = xPos(12) + Math.cos(rad) * 17
            const y2 = padT + 36 + Math.sin(rad) * 17
            return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f5a623" strokeWidth="1" opacity="0.25" strokeLinecap="round" />
          })}

          {gridLines.map((gl, i) => (
            <g key={i}>
              <line x1={padL} y1={gl.y} x2={W - padR} y2={gl.y} className="grid-line" />
              <text x={padL - 10} y={gl.y + 3} className="y-label">{gl.label}</text>
            </g>
          ))}
          {hours.filter(h => h % 3 === 0).map(h => (
            <text key={h} x={xPos(h)} y={H - 10} className="time-marker">{timeLabels[h]}</text>
          ))}

          {batteryZones.selfConsume.map((pts, i) => <polygon key={`sc${i}`} points={pts} fill="url(#gradBattSC)" opacity="0.5" />)}
          {batteryZones.charge.map((pts, i) => <polygon key={`ch${i}`} points={pts} fill="url(#gradBattCharge)" />)}
          {batteryZones.discharge.map((pts, i) => <polygon key={`di${i}`} points={pts} fill="url(#gradBattDischarge)" />)}
          {batteryZones.gridImp.map((pts, i) => <polygon key={`gi${i}`} points={pts} fill="url(#gradBattImport)" />)}

          <path d={solarCurve} fill="none" stroke="#f5a623" strokeWidth="2" opacity="0.4" strokeDasharray="6 3" />
          <path d={loadCurve} fill="none" stroke="#e000f0" strokeWidth="2.5" opacity="0.7" />

          <text x={xPos(11)} y={yPos(5)} fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="#30d158" textAnchor="middle" letterSpacing="2" opacity="0.8">CHARGING</text>
          <text x={xPos(19)} y={yPos(1.8)} fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="#5ee07a" textAnchor="middle" letterSpacing="2" opacity="0.8">BATTERY</text>
        </svg>
      </div>

      {/* SOC mini chart */}
      <div className="s4-soc-chart">
        <svg viewBox={`0 0 ${W} ${socH}`} preserveAspectRatio="xMidYMid meet">
          <line x1={padL} y1={socH / 2} x2={W - padR} y2={socH / 2} stroke="rgba(255,255,255,0.04)" />
          <text x={padL - 10} y={14} className="y-label" fontSize="8">100%</text>
          <text x={padL - 10} y={socH - 4} className="y-label" fontSize="8">0%</text>
          <path d={socCurve} fill="none" stroke="#30d158" strokeWidth="2" opacity="0.8" />
        </svg>
        <div className="s4-soc-label">Battery SOC</div>
      </div>

      <div className="s4-legend">
        <div className="legend-item"><div className="legend-swatch" style={{ background: 'rgba(224,0,240,0.5)' }} />Usage</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: 'rgba(245,166,35,0.4)' }} />Solar</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: 'rgba(48,209,88,0.3)' }} />Charging</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: 'rgba(94,224,122,0.35)' }} />Discharging</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: 'rgba(255,69,58,0.15)' }} />Grid Import</div>
      </div>
    </div>
  )

  const beats = [
    {
      id: 'charging', time: '\u26a1 Charging \u00b7 9am \u2013 3pm', timeClass: 'charging',
      title: 'Battery soaks up the surplus',
      content: <span>While the sun blazes, your {cfg.battery.usableCapacityKwh} kWh battery charges to <span className="green-strong">100%</span>. All that wasted export? Now it&rsquo;s stored energy you&rsquo;ll use tonight.</span>,
    },
    {
      id: 'discharging', time: '\ud83d\udd0b Discharging \u00b7 3pm \u2013 11pm', timeClass: 'discharging',
      title: 'Battery powers your evening',
      content: <span>As the sun sets and your usage peaks, the battery takes over &mdash; delivering <span className="green-strong">{sim.totalBattDischarge.toFixed(1)} kWh</span> of stored solar. No grid needed.</span>,
    },
    {
      id: 'overnight', time: '\ud83c\udf19 Overnight \u00b7 11pm \u2013 6am', timeClass: 'overnight',
      title: 'Still running on solar',
      content: <span>Even after dark, the battery keeps going. Only <span className="red-strong">{sim.totalGridImport.toFixed(1)} kWh</span> comes from the grid all day &mdash; that&rsquo;s <span className="green-strong">{sim.selfPoweredPct}% self-powered</span>.</span>,
    },
  ]

  return (
    <div>
      <Hero badge="Section 04 — Adding Battery" title="Now add a" highlightText="battery" subtitle={`A ${cfg.battery.usableCapacityKwh} kWh battery captures midday solar and shifts it to when you actually need it. Watch the grid imports shrink to almost nothing.`} />

      <StickyBeatChart chart={chartNode} beats={beats} activeBeat={activeBeat} onBeatChange={setActiveBeat} />

      {/* Comparison cards */}
      <ScrollSection>
        <div className="section-label">Solar Only vs Solar + Battery</div>
        <div className="s4-compare-grid">
          <div className="s4-compare-card solar-border">
            <div className="s4-compare-label">Solar Only</div>
            <div className="s4-compare-row"><span>Grid Import</span><span className="red">{solarOnlyMetrics.gridImport.toFixed(1)} kWh</span></div>
            <div className="s4-compare-row"><span>Self-consumption</span><span>{solarOnlyMetrics.scPct}%</span></div>
            <div className="s4-compare-row"><span>Daily Cost</span><span className="red">${solarOnlyMetrics.dailyCost}</span></div>
          </div>
          <div className="s4-compare-card battery-border">
            <div className="s4-compare-label green">Solar + Battery</div>
            <div className="s4-compare-row"><span>Grid Import</span><span className="green">{sim.totalGridImport.toFixed(1)} kWh</span></div>
            <div className="s4-compare-row"><span>Self-powered</span><span className="green">{sim.selfPoweredPct}%</span></div>
            <div className="s4-compare-row"><span>Daily Cost</span><span className="green">{(() => { const v = sim.totalGridImport * cfg.tariff.rate + cfg.tariff.supply - sim.gridExport.reduce((a, b) => a + b, 0) * cfg.tariff.fit; return v < 0 ? `-$${Math.abs(v).toFixed(2)}` : `$${v.toFixed(2)}`; })()}</span></div>
          </div>
        </div>
      </ScrollSection>

      <ScrollSection>
        <div className="cta-section">
          <h2>From {solarOnlyMetrics.scPct}% to<br /><span className="highlight">{sim.selfPoweredPct}% self-powered</span></h2>
          <p>Let&rsquo;s now compare all three scenarios side by side.</p>
        </div>
      </ScrollSection>
    </div>
  )
}
