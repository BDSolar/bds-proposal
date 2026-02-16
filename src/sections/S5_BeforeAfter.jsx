import { useMemo, useState, useCallback } from 'react'
import { useProposal } from '../context/ProposalContext'
import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import { getTotalLoad, hours, timeLabels } from '../data/loadProfile'
import { getSolarForSystemSize } from '../data/solarProfile'
import { catmullRomPath } from '../utils/catmullRom'
import { simulateBattery } from '../utils/batterySimulation'
import systemConfig from '../data/systemConfig'
import '../styles/sections/s5.css'

const W = 1000, H = 380
const padL = 55, padR = 20, padT = 20, padB = 50
const chartW = W - padL - padR
const chartH = H - padT - padB

export default function S5_BeforeAfter() {
  const { state } = useProposal()
  const er = state.engineResults
  const cfg = er ? {
    tariff: er.assumptions.tariff,
  } : systemConfig
  const [scenario, setScenario] = useState('no-solar')

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
  const totalUsage = useMemo(() => totalLoad.reduce((a, b) => a + b, 0), [totalLoad])

  const xPos = useCallback((h) => padL + (h / 23) * chartW, [])
  const yPos = useCallback((val) => padT + chartH - (val / maxVal) * chartH, [maxVal])
  const base = padT + chartH

  // Curves
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

  // Scenario metrics
  const metrics = useMemo(() => {
    const solarSC = hours.map(h => Math.min(totalLoad[h], solar[h]))
    const solarGI = hours.map(h => Math.max(0, totalLoad[h] - solar[h]))
    const solarExport = hours.map(h => Math.max(0, solar[h] - totalLoad[h]))
    const solarTotalImport = solarGI.reduce((a, b) => a + b, 0)
    const solarTotalSC = solarSC.reduce((a, b) => a + b, 0)
    const solarScPct = Math.round((solarTotalSC / totalUsage) * 100)

    const rate = cfg.tariff.rate
    const supply = cfg.tariff.supply
    const fit = cfg.tariff.fit
    const solarExportTotal = solarExport.reduce((a, b) => a + b, 0)
    const battExportTotal = sim.gridExport.reduce((a, b) => a + b, 0)

    const noSolarDaily = totalUsage * rate + supply
    const solarDaily = Math.max(0, solarTotalImport * rate + supply - solarExportTotal * fit)
    const battDaily = Math.max(0, sim.totalGridImport * rate + supply - battExportTotal * fit)

    return {
      noSolar: {
        gridImport: totalUsage, scPct: 0,
        dailyCost: noSolarDaily, annualCost: Math.round(noSolarDaily * 365),
      },
      solarOnly: {
        gridImport: solarTotalImport, scPct: solarScPct,
        dailyCost: solarDaily, annualCost: Math.round(solarDaily * 365),
        solarSC, solarGI, solarExport,
      },
      solarBattery: {
        gridImport: sim.totalGridImport, scPct: sim.selfPoweredPct,
        dailyCost: battDaily, annualCost: Math.round(battDaily * 365),
      },
    }
  }, [totalLoad, totalUsage, sim])

  // Zone polygons per scenario
  const zones = useMemo(() => {
    const noSolarZones = []
    const solarZones = { sc: [], ex: [], imp: [] }
    const battZones = { sc: [], ch: [], di: [], imp: [] }

    for (let h = 0; h < 23; h++) {
      const x1 = xPos(h), x2 = xPos(h + 1)
      const h2 = h + 1

      // No solar: full grid
      noSolarZones.push(`${x1},${base} ${x1},${yPos(totalLoad[h])} ${x2},${yPos(totalLoad[h2])} ${x2},${base}`)

      // Solar only zones
      const sc1 = metrics.solarOnly.solarSC[h], sc2 = metrics.solarOnly.solarSC[h2]
      if (sc1 > 0 || sc2 > 0) solarZones.sc.push(`${x1},${base} ${x1},${yPos(sc1)} ${x2},${yPos(sc2)} ${x2},${base}`)
      const e1 = metrics.solarOnly.solarExport[h], e2 = metrics.solarOnly.solarExport[h2]
      if (e1 > 0 || e2 > 0) {
        const b1 = totalLoad[h], b2 = totalLoad[h2], t1 = solar[h], t2 = solar[h2]
        if (t1 > b1 || t2 > b2) solarZones.ex.push(`${x1},${yPos(Math.max(b1, 0))} ${x1},${yPos(Math.max(t1, b1))} ${x2},${yPos(Math.max(t2, b2))} ${x2},${yPos(Math.max(b2, 0))}`)
      }
      const gi1 = metrics.solarOnly.solarGI[h], gi2 = metrics.solarOnly.solarGI[h2]
      if (gi1 > 0 || gi2 > 0) {
        const b1 = Math.max(solar[h], 0), b2 = Math.max(solar[h2], 0)
        if (totalLoad[h] > b1 || totalLoad[h2] > b2) solarZones.imp.push(`${x1},${yPos(b1)} ${x1},${yPos(totalLoad[h])} ${x2},${yPos(totalLoad[h2])} ${x2},${yPos(b2)}`)
      }

      // Battery zones
      const bsc1 = sim.selfConsume[h], bsc2 = sim.selfConsume[h2]
      if (bsc1 > 0 || bsc2 > 0) battZones.sc.push(`${x1},${base} ${x1},${yPos(bsc1)} ${x2},${yPos(bsc2)} ${x2},${base}`)
      if (sim.battCharge[h] > 0 || sim.battCharge[h2] > 0) {
        const l1 = totalLoad[h], l2 = totalLoad[h2], s1 = solar[h], s2 = solar[h2]
        if (s1 > l1 || s2 > l2) battZones.ch.push(`${x1},${yPos(Math.max(l1, 0))} ${x1},${yPos(Math.max(s1, l1))} ${x2},${yPos(Math.max(s2, l2))} ${x2},${yPos(Math.max(l2, 0))}`)
      }
      if (sim.battDischarge[h] > 0 || sim.battDischarge[h2] > 0) {
        const s1 = solar[h], s2 = solar[h2], bd1 = sim.battDischarge[h], bd2 = sim.battDischarge[h2]
        const bot1 = Math.max(s1, 0), bot2 = Math.max(s2, 0)
        const top1 = Math.min(s1 + bd1, totalLoad[h]), top2 = Math.min(s2 + bd2, totalLoad[h2])
        if (top1 > bot1 || top2 > bot2) battZones.di.push(`${x1},${yPos(bot1)} ${x1},${yPos(top1)} ${x2},${yPos(top2)} ${x2},${yPos(bot2)}`)
      }
      if (sim.gridImport[h] > 0 || sim.gridImport[h2] > 0) {
        const s1 = solar[h], s2 = solar[h2], bd1 = sim.battDischarge[h], bd2 = sim.battDischarge[h2]
        const bot1 = Math.max(s1 + bd1, 0), bot2 = Math.max(s2 + bd2, 0)
        if (totalLoad[h] > bot1 || totalLoad[h2] > bot2) battZones.imp.push(`${x1},${yPos(bot1)} ${x1},${yPos(totalLoad[h])} ${x2},${yPos(totalLoad[h2])} ${x2},${yPos(bot2)}`)
      }
    }
    return { noSolarZones, solarZones, battZones }
  }, [xPos, yPos, base, totalLoad, metrics, sim])

  const current = metrics[scenario === 'no-solar' ? 'noSolar' : scenario === 'solar-only' ? 'solarOnly' : 'solarBattery']

  const scenarioTabs = [
    { id: 'no-solar', label: 'Grid Only', color: 'var(--red)' },
    { id: 'solar-only', label: 'Solar Only', color: 'var(--solar)' },
    { id: 'solar-battery', label: 'Solar + Battery', color: 'var(--green)' },
  ]

  return (
    <div>
      <Hero badge="Section 05 — Before & After" title="See the" highlightText="difference" subtitle="Three scenarios. Same house. Completely different outcomes." />

      <ScrollSection>
        <div className="section-label">Scenario Comparison</div>

        {/* Toggle tabs */}
        <div className="s5-tabs">
          {scenarioTabs.map(tab => (
            <button
              key={tab.id}
              className={`s5-tab${scenario === tab.id ? ' active' : ''}`}
              style={{ '--tab-color': tab.color }}
              onClick={() => setScenario(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="s5-chart-container">
          <div className="chart-header">
            <div className="chart-title">
              {scenario === 'no-solar' && 'No Solar — 100% Grid'}
              {scenario === 'solar-only' && `Solar Only — ${metrics.solarOnly.scPct}% Self-Use`}
              {scenario === 'solar-battery' && `Solar + Battery — ${sim.selfPoweredPct}% Self-Powered`}
            </div>
          </div>
          <div className="chart-area s5-chart-area">
            <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="s5gradGrid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff453a" stopOpacity="0.2" /><stop offset="100%" stopColor="#ff453a" stopOpacity="0.02" /></linearGradient>
                <linearGradient id="s5gradSC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#30d158" stopOpacity="0.25" /><stop offset="100%" stopColor="#30d158" stopOpacity="0.03" /></linearGradient>
                <linearGradient id="s5gradExport" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffd60a" stopOpacity="0.15" /><stop offset="100%" stopColor="#ffd60a" stopOpacity="0.02" /></linearGradient>
                <linearGradient id="s5gradImp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff453a" stopOpacity="0.2" /><stop offset="100%" stopColor="#ff453a" stopOpacity="0.02" /></linearGradient>
                <linearGradient id="s5gradCharge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#30d158" stopOpacity="0.3" /><stop offset="100%" stopColor="#30d158" stopOpacity="0.03" /></linearGradient>
                <linearGradient id="s5gradDis" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5ee07a" stopOpacity="0.35" /><stop offset="100%" stopColor="#5ee07a" stopOpacity="0.03" /></linearGradient>
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

              {/* Scenario zones */}
              <g className="s5-zone-group" style={{ transition: 'opacity 0.8s ease' }}>
                {scenario === 'no-solar' && (
                  <>
                    {zones.noSolarZones.map((pts, i) => <polygon key={i} points={pts} fill="url(#s5gradGrid)" />)}
                    <text x={xPos(12)} y={yPos(2.5)} fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#ff453a" textAnchor="middle" letterSpacing="3" opacity="0.8">ALL FROM GRID</text>
                  </>
                )}
                {scenario === 'solar-only' && (
                  <>
                    {zones.solarZones.sc.map((pts, i) => <polygon key={`sc${i}`} points={pts} fill="url(#s5gradSC)" />)}
                    {zones.solarZones.ex.map((pts, i) => <polygon key={`ex${i}`} points={pts} fill="url(#s5gradExport)" />)}
                    {zones.solarZones.imp.map((pts, i) => <polygon key={`im${i}`} points={pts} fill="url(#s5gradImp)" />)}
                    <path d={solarCurve} fill="none" stroke="#f5a623" strokeWidth="2.5" opacity="0.8" />
                  </>
                )}
                {scenario === 'solar-battery' && (
                  <>
                    {zones.battZones.sc.map((pts, i) => <polygon key={`sc${i}`} points={pts} fill="url(#s5gradSC)" opacity="0.5" />)}
                    {zones.battZones.ch.map((pts, i) => <polygon key={`ch${i}`} points={pts} fill="url(#s5gradCharge)" />)}
                    {zones.battZones.di.map((pts, i) => <polygon key={`di${i}`} points={pts} fill="url(#s5gradDis)" />)}
                    {zones.battZones.imp.map((pts, i) => <polygon key={`im${i}`} points={pts} fill="url(#s5gradImp)" />)}
                    <path d={solarCurve} fill="none" stroke="#f5a623" strokeWidth="2" opacity="0.4" strokeDasharray="6 3" />
                  </>
                )}
              </g>

              <path d={loadCurve} fill="none" stroke="#e000f0" strokeWidth="2.5" opacity="0.7" />
            </svg>
          </div>

          {/* Cost ticker */}
          <div className="s5-cost-ticker">
            <div className={`s5-cost-value ${scenario === 'no-solar' ? 'red' : scenario === 'solar-only' ? 'solar-color' : 'green'}`}>
              ${current.dailyCost.toFixed(2)}
            </div>
            <div className="s5-cost-label">/day &middot; ${current.annualCost.toLocaleString()}/year</div>
          </div>
        </div>
      </ScrollSection>

      {/* Comparison metrics */}
      <ScrollSection>
        <div className="s5-metric-grid">
          {[
            { label: 'Grid Only', ...metrics.noSolar, cls: 'red' },
            { label: 'Solar Only', ...metrics.solarOnly, cls: 'solar' },
            { label: 'Solar + Battery', ...metrics.solarBattery, cls: 'green' },
          ].map(s => (
            <div key={s.label} className={`s5-metric-card ${s.cls}-border`}>
              <div className="s5-metric-label">{s.label}</div>
              <div className="s5-metric-row"><span>Grid Import</span><span>{s.gridImport.toFixed(1)} kWh</span></div>
              <div className="s5-metric-row"><span>Self-powered</span><span>{s.scPct}%</span></div>
              <div className="s5-metric-row"><span>Daily Cost</span><span className={s.cls}>${s.dailyCost.toFixed(2)}</span></div>
              <div className="s5-metric-row"><span>Annual Cost</span><span className={s.cls}>${s.annualCost.toLocaleString()}</span></div>
            </div>
          ))}
        </div>
      </ScrollSection>

      <ScrollSection>
        <div className="cta-section">
          <h2>From ${metrics.noSolar.annualCost.toLocaleString()} to<br /><span className="highlight">$0 per year</span></h2>
          <p>Now let&rsquo;s look at what that means over 20 years.</p>
          <img src={`${import.meta.env.BASE_URL}house-power.png`} alt="Solar-powered home" className="s5-house-img" />
        </div>
      </ScrollSection>
    </div>
  )
}
