import { useProposal } from '../context/ProposalContext'
import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import systemConfig from '../data/systemConfig'
import '../styles/sections/s7.css'

function buildCfgFromEngine(er) {
  const p = er.system.panels
  const b = er.system.battery
  return {
    system: {
      panelBrand: p.brand, panelModel: p.model, panelSeries: p.series,
      panelTechnology: p.technology, panelWp: p.wattage, panelCount: p.panelCount,
      panelEfficiency: p.efficiency, panelCellType: p.cellType,
      panelWarrantyProduct: parseInt(p.warranty), panelWarrantyPerformance: parseInt(p.warranty.split('+')[1]),
      panelDegradation: p.degradation ?? 0.35,
      arrayKw: p.totalKw, dailyProduction: er.system.dailyProduction,
    },
    battery: {
      brand: b.brand, model: b.model, totalCapacityKwh: b.totalCapacity,
      usableCapacityKwh: b.usableCapacity, modules: b.modules,
      capacityPerModule: b.capacityPerModule, inverterSize: b.inverterSize,
      evChargerKw: b.evChargerKw, chemistry: b.chemistry, cycles: b.cycles,
      ip: b.ip, features: b.features, evCharger: b.evCharger, warranty: b.warranty ?? '10yr',
    },
    financial: { coverageRatio: er.system.coverageRatio },
  }
}

export default function S7_YourSystem() {
  const { state } = useProposal()
  const er = state.engineResults
  const cfg = er ? buildCfgFromEngine(er) : systemConfig
  return (
    <div>
      <Hero badge="Section 07 — Your System" title="Meet your" highlightText="system" subtitle="Premium components, engineered to 150% of your usage. Here's exactly what powers your Bill-to-Zero home." />

      {/* Product Cards */}
      <ScrollSection>
        <div className="section-label">Your Components</div>
        <div className="s7-components-stack">
        <div className="s7-overview-card">
          <div className="s7-overview-row">
            <div className="s7-overview-item">
              <span className="s7-overview-value">{cfg.system.arrayKw}<span className="s7-overview-unit"> kW</span></span>
              <span className="s7-overview-label">Solar</span>
            </div>
            <span className="s7-overview-plus">+</span>
            <div className="s7-overview-item">
              <span className="s7-overview-value">{cfg.battery.usableCapacityKwh}<span className="s7-overview-unit"> kWh</span></span>
              <span className="s7-overview-label">Battery</span>
            </div>
          </div>
        </div>
        <div className="s7-product-grid">
          {/* Panel Card */}
          <div className="s7-product-card solar-top">
            <div className="s7-product-header">
              <div className="s7-product-logo">
                <img src={`${import.meta.env.BASE_URL}longi-logo.svg`} alt="LONGi" className="s7-logo-img" />
              </div>
              <div className="s7-product-model">{cfg.system.panelModel} {cfg.system.panelSeries}</div>
            </div>
            <div className="s7-product-illustration">
              {/* Two panels nearly touching with electric mist between them */}
              <svg viewBox="0 0 262 220" className="s7-panel-svg">
                <defs>
                  <linearGradient id="pFrame" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1c1c1c" />
                    <stop offset="100%" stopColor="#0a0a0a" />
                  </linearGradient>
                  <linearGradient id="pGlass" x1="0" y1="0" x2="0.2" y2="1">
                    <stop offset="0%" stopColor="#18181f" />
                    <stop offset="100%" stopColor="#0b0b10" />
                  </linearGradient>
                  <linearGradient id="pSheen" x1="0" y1="0" x2="0.6" y2="0.6">
                    <stop offset="0%" stopColor="white" stopOpacity="0.07" />
                    <stop offset="40%" stopColor="white" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5a623" stopOpacity="0" />
                    <stop offset="10%" stopColor="#f5a623" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#ffcc44" stopOpacity="0.35" />
                    <stop offset="90%" stopColor="#f5a623" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="edgeGlowH" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f5a623" stopOpacity="0" />
                    <stop offset="35%" stopColor="#f5a623" stopOpacity="0.12" />
                    <stop offset="50%" stopColor="#ffcc44" stopOpacity="0.2" />
                    <stop offset="65%" stopColor="#f5a623" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
                  </linearGradient>
                  <filter id="pGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="mistGlow" x="-200%" y="-5%" width="500%" height="110%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="cometGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* ── Panel 1 (left) ── */}
                <rect x="9" y="9" width="120" height="196" rx="2" fill="#000" opacity="0.4" />
                <rect x="6" y="6" width="120" height="196" rx="2" fill="url(#pFrame)" stroke="#2a2a2a" strokeWidth="1" />
                <rect x="9" y="9" width="114" height="190" rx="1" fill="url(#pGlass)" />
                {Array.from({ length: 11 }, (_, r) =>
                  Array.from({ length: 6 }, (_, c) => (
                    <rect key={`a${c}-${r}`}
                      x={10.5 + c * 18.5} y={10.5 + r * 17}
                      width="17.5" height="16" rx="0.3"
                      fill="#0e0e16" stroke="#161622" strokeWidth="0.4" opacity="0.9" />
                  ))
                )}
                <line x1="10" y1="104" x2="122" y2="104" stroke="#0a0a12" strokeWidth="1" />
                <rect x="9" y="9" width="114" height="190" rx="1" fill="url(#pSheen)" />

                {/* ── Panel 2 (right) ── */}
                <rect x="139" y="9" width="120" height="196" rx="2" fill="#000" opacity="0.4" />
                <rect x="136" y="6" width="120" height="196" rx="2" fill="url(#pFrame)" stroke="#2a2a2a" strokeWidth="1" />
                <rect x="139" y="9" width="114" height="190" rx="1" fill="url(#pGlass)" />
                {Array.from({ length: 11 }, (_, r) =>
                  Array.from({ length: 6 }, (_, c) => (
                    <rect key={`b${c}-${r}`}
                      x={140.5 + c * 18.5} y={10.5 + r * 17}
                      width="17.5" height="16" rx="0.3"
                      fill="#0e0e16" stroke="#161622" strokeWidth="0.4" opacity="0.9" />
                  ))
                )}
                <line x1="140" y1="104" x2="254" y2="104" stroke="#0a0a12" strokeWidth="1" />
                <rect x="139" y="9" width="114" height="190" rx="1" fill="url(#pSheen)" />

                {/* ── Electric mist — subtle haze of electrons ── */}
                {/* Ambient glow column */}
                <rect x="122" y="6" width="18" height="196" rx="9" fill="url(#mistGrad)" filter="url(#mistGlow)" />
                {/* Edge glow — top and bottom */}
                <rect x="95" y="2" width="72" height="6" rx="3" fill="url(#edgeGlowH)" filter="url(#mistGlow)" />
                <rect x="95" y="200" width="72" height="6" rx="3" fill="url(#edgeGlowH)" filter="url(#mistGlow)" />
                {/* Edge glow — panel inner edges */}
                <rect x="122" y="6" width="5" height="196" rx="2.5" fill="#f5a623" opacity="0.05" filter="url(#mistGlow)" />
                <rect x="135" y="6" width="5" height="196" rx="2.5" fill="#f5a623" opacity="0.05" filter="url(#mistGlow)" />
                {/* Electron cloud — particles drifting up and down */}
                {Array.from({ length: 18 }, (_, i) => {
                  const y = 12 + i * 10.5
                  const x = 127 + (i % 4) * 2.2
                  const r = 0.4 + (i % 3) * 0.2
                  return (
                    <circle key={`e${i}`} cx={x} cy={y} r={r}
                      fill={i % 3 === 0 ? '#ffcc44' : '#f5a623'}
                      filter="url(#mistGlow)"
                      className={i % 2 === 0 ? 's7-mist-up' : 's7-mist-down'}
                      style={{ animationDelay: `${(i * 0.23).toFixed(2)}s` }} />
                  )
                })}

                {/* ── Comet trace — bright head leading, fading tail behind ── */}
                {/* Layer 1: wide faint outer tail (full 130px, starts at 0) */}
                <path d="M 4,4 L 128,4 L 128,104 L 134,104 L 134,4 L 258,4 L 258,204 L 134,204 L 134,114 L 128,114 L 128,204 L 4,204 Z"
                  fill="none" stroke="#f5a623" strokeWidth="4" opacity="0.05"
                  strokeDasharray="130 1160" filter="url(#cometGlow)" className="s7-trace-orange" />
                {/* Layer 2: medium tail (65px, offset so it ends with tail) */}
                <path d="M 4,4 L 128,4 L 128,104 L 134,104 L 134,4 L 258,4 L 258,204 L 134,204 L 134,114 L 128,114 L 128,204 L 4,204 Z"
                  fill="none" stroke="#f5a623" strokeWidth="2.5" opacity="0.14"
                  strokeDasharray="0.01 65 65 1159.99" className="s7-trace-orange" />
                {/* Layer 3: inner trail (28px, offset to align with leading edge) */}
                <path d="M 4,4 L 128,4 L 128,104 L 134,104 L 134,4 L 258,4 L 258,204 L 134,204 L 134,114 L 128,114 L 128,204 L 4,204 Z"
                  fill="none" stroke="#ffbe44" strokeWidth="1.8" opacity="0.35"
                  strokeDasharray="0.01 102 28 1159.99" className="s7-trace-orange" />
                {/* Layer 4: bright comet head (8px, at the very leading edge) */}
                <path d="M 4,4 L 128,4 L 128,104 L 134,104 L 134,4 L 258,4 L 258,204 L 134,204 L 134,114 L 128,114 L 128,204 L 4,204 Z"
                  fill="none" stroke="#ffe88a" strokeWidth="1.5" opacity="0.95"
                  strokeDasharray="0.01 122 8 1159.99" filter="url(#cometGlow)" className="s7-trace-orange" />
              </svg>
            </div>
            <div className="s7-specs-grid">
              <div className="s7-spec"><span className="s7-spec-val">{cfg.system.panelWp}W</span><span className="s7-spec-label">Per Panel</span></div>
              <div className="s7-spec"><span className="s7-spec-val">{cfg.system.panelEfficiency}%</span><span className="s7-spec-label">Efficiency</span></div>
              <div className="s7-spec"><span className="s7-spec-val">&times; {cfg.system.panelCount}</span><span className="s7-spec-label">Panels</span></div>
              <div className="s7-spec"><span className="s7-spec-val">{cfg.system.arrayKw} kW</span><span className="s7-spec-label">Total System</span></div>
              <div className="s7-spec"><span className="s7-spec-val">{cfg.system.panelWarrantyProduct} + {cfg.system.panelWarrantyPerformance}yr</span><span className="s7-spec-label">Warranty</span></div>
              <div className="s7-spec"><span className="s7-spec-val">{cfg.system.panelCellType}</span><span className="s7-spec-label">Cell Type</span></div>
            </div>
            <div className="s7-features">
              {[cfg.system.panelTechnology, 'Zero Busbar', 'Anti-Dust', 'Shade Optimiser'].map(f => (
                <span key={f} className="s7-feature-pill solar">{f}</span>
              ))}
            </div>
          </div>

          {/* Battery Card */}
          <div className="s7-product-card battery-top">
            <div className="s7-product-header">
              <div className="s7-product-logo">
                <img src={`${import.meta.env.BASE_URL}sigenergy-logo.svg`} alt="Sigenergy" className="s7-logo-img" />
              </div>
              <div className="s7-product-model">{cfg.battery.model}</div>
            </div>
            <div className="s7-product-illustration">
              {(() => {
                const modules = cfg.battery.modules || 4
                const ctrlH = 48
                const modH = 28
                const modGap = 2
                const stackH = modules * modH + (modules - 1) * modGap
                const totalH = ctrlH + 2 + stackH + 16
                const w = 120
                const bodyL = 10
                const bodyW = 100
                const bodyR = bodyL + bodyW
                const radius = 8
                const eyeX = bodyR - 18
                const eyeY = 28
                // Build snake path: bottom of last module → up right side → to eye
                const snakeSegments = []
                for (let i = modules - 1; i >= 0; i--) {
                  const my = 8 + ctrlH + 2 + i * (modH + modGap)
                  const mx = bodyR + 6
                  if (i === modules - 1) snakeSegments.push(`M ${mx} ${my + modH}`)
                  snakeSegments.push(`L ${mx} ${my}`)
                }
                snakeSegments.push(`L ${bodyR + 6} ${8 + ctrlH}`)
                snakeSegments.push(`L ${bodyR + 6} ${eyeY}`)
                snakeSegments.push(`L ${eyeX + 7} ${eyeY}`)
                const snakePath = snakeSegments.join(' ')
                const snakeLen = stackH + ctrlH + 20
                return (
                  <svg viewBox={`0 0 ${w + 14} ${totalH}`} className="s7-battery-svg">
                    <defs>
                      <linearGradient id="bBody" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#d8d8dc" />
                        <stop offset="50%" stopColor="#eaeaee" />
                        <stop offset="100%" stopColor="#d0d0d4" />
                      </linearGradient>
                      <linearGradient id="bSide" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#b0b0b4" />
                        <stop offset="100%" stopColor="#c8c8cc" />
                      </linearGradient>
                      <radialGradient id="bEye" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="30%" stopColor="#66ccff" />
                        <stop offset="100%" stopColor="#2288ff" />
                      </radialGradient>
                      <filter id="bGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                      <filter id="eyeGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    {/* Drop shadow */}
                    <rect x={bodyL + 3} y={8 + 3} width={bodyW} height={totalH - 12} rx={radius} fill="#000" opacity="0.3" />

                    {/* ── Energy Controller ── */}
                    <rect x={bodyL} y={8} width={bodyW} height={ctrlH} rx={radius} fill="url(#bBody)" />
                    <rect x={bodyL} y={8} width={4} height={ctrlH} rx="2" fill="url(#bSide)" />
                    {/* SIGENERGY text */}
                    <text x={bodyL + 14} y={34} fontFamily="'Inter', sans-serif" fontSize="5.5" fontWeight="600" fill="#888" letterSpacing="1.8">SIGENERGY</text>
                    <line x1={bodyL + 4} y1={8 + ctrlH - 1} x2={bodyR - 4} y2={8 + ctrlH - 1} stroke="#c0c0c0" strokeWidth="0.5" />

                    {/* Eagle eye — bright blue flash */}
                    <circle cx={eyeX} cy={eyeY} r={9} fill="#0066ff" opacity="0.15" className="s7-eye-flash" filter="url(#eyeGlow)" />
                    <circle cx={eyeX} cy={eyeY} r={7} fill="#1a1a2e" />
                    <circle cx={eyeX} cy={eyeY} r={5.5} fill="url(#bEye)" className="s7-eye-flash" />
                    <circle cx={eyeX} cy={eyeY} r={2} fill="white" opacity="0.9" />

                    {/* ── Battery Modules with blue traces ── */}
                    {Array.from({ length: modules }, (_, i) => {
                      const y = 8 + ctrlH + 2 + i * (modH + modGap)
                      const isLast = i === modules - 1
                      const perim = (bodyW + modH) * 2
                      return (
                        <g key={`m${i}`}>
                          {/* Module body */}
                          <rect x={bodyL} y={y} width={bodyW} height={modH}
                            rx={isLast ? radius : 0} fill="url(#bBody)" />
                          <rect x={bodyL} y={y} width={4} height={modH}
                            rx={isLast ? 2 : 0} fill="url(#bSide)" />
                          {!isLast && (
                            <line x1={bodyL + 4} y1={y + modH} x2={bodyR - 4} y2={y + modH} stroke="#c0c0c4" strokeWidth="0.5" />
                          )}
                          {/* Blue trace around each module */}
                          <rect x={bodyL - 1} y={y - 1} width={bodyW + 2} height={modH + 2}
                            rx={isLast ? radius + 1 : 1} fill="none"
                            stroke="#2288ff" strokeWidth="1" opacity="0.3" filter="url(#bGlow)" />
                          <rect x={bodyL - 1} y={y - 1} width={bodyW + 2} height={modH + 2}
                            rx={isLast ? radius + 1 : 1} fill="none"
                            stroke="#44aaff" strokeWidth="1"
                            strokeDasharray={`20 ${perim - 20}`}
                            className="s7-trace-blue"
                            style={{ animationDelay: `${i * 0.4}s` }} />
                        </g>
                      )
                    })}

                    {/* Snake path — blue energy flowing up to eye */}
                    <path d={snakePath} fill="none" stroke="#2288ff" strokeWidth="1" opacity="0.2" filter="url(#bGlow)" />
                    <path d={snakePath} fill="none" stroke="#44aaff" strokeWidth="1.5"
                      strokeDasharray={`30 ${snakeLen}`}
                      className="s7-trace-snake" />

                    {/* Module count label */}
                    <text x={w / 2} y={totalH - 1} fontFamily="'JetBrains Mono', monospace" fontSize="5" fill="#555" textAnchor="middle" letterSpacing="1.5">{modules} x {cfg.battery.capacityPerModule} kWh</text>
                  </svg>
                )
              })()}
            </div>
            <div className="s7-specs-grid">
              <div className="s7-spec"><span className="s7-spec-val">{cfg.battery.totalCapacityKwh} kWh</span><span className="s7-spec-label">Capacity</span></div>
              <div className="s7-spec"><span className="s7-spec-val">{cfg.battery.usableCapacityKwh} kWh</span><span className="s7-spec-label">Usable</span></div>
              <div className="s7-spec"><span className="s7-spec-val">{cfg.battery.inverterSize} kW</span><span className="s7-spec-label">Inverter</span></div>
              <div className="s7-spec"><span className="s7-spec-val">{cfg.battery.evChargerKw} kW</span><span className="s7-spec-label">EV Charger</span></div>
              <div className="s7-spec"><span className="s7-spec-val">{cfg.battery.chemistry}</span><span className="s7-spec-label">Chemistry</span></div>
              <div className="s7-spec"><span className="s7-spec-val">{cfg.battery.cycles}</span><span className="s7-spec-label">Cycle Life</span></div>
            </div>
            <div className="s7-features">
              {['5-in-1', 'Modular', cfg.battery.ip, 'Blackout Backup', 'AI Energy Mgmt'].map(f => (
                <span key={f} className="s7-feature-pill battery">{f}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="s7-warranty-banner">
          <div className="s7-warranty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="s7-warranty-content">
            <h3 className="s7-warranty-title">30-Year Warranty Coverage</h3>
            <p className="s7-warranty-sub">Performance &middot; Workmanship &middot; Monitoring &mdash; all covered</p>
          </div>
        </div>
        </div>
      </ScrollSection>

      {/* System Options */}
      {er?.options && (
        <ScrollSection>
          <div className="section-label">System Options</div>
          <div className="s7-options-grid">
            {er.options.map((opt) => {
              const isRecommended = opt.coverageRatio === 1.5
              return (
                <div key={opt.coveragePct} className={`s7-option-card${isRecommended ? ' recommended' : ''}`}>
                  {isRecommended && <div className="s7-option-recommended">Recommended</div>}
                  <div className="s7-option-badge">{opt.coveragePct}%</div>
                  <div className="s7-option-label">Coverage</div>

                  <div className="s7-option-price">${opt.systemPrice.toLocaleString()}</div>
                  <div className="s7-option-price-note">inc. GST, after rebates</div>

                  <div className="s7-option-stats">
                    <div className="s7-option-stat">
                      <span className="s7-option-stat-val">{opt.panelCount}</span>
                      <span className="s7-option-stat-label">Panels</span>
                    </div>
                    <div className="s7-option-stat">
                      <span className="s7-option-stat-val">{opt.arrayKw} kW</span>
                      <span className="s7-option-stat-label">Solar</span>
                    </div>
                    <div className="s7-option-stat">
                      <span className="s7-option-stat-val">{opt.batteryKwh} kWh</span>
                      <span className="s7-option-stat-label">Battery</span>
                    </div>
                  </div>

                  <div className="s7-option-divider" />

                  <div className="s7-option-annual">
                    <span className="s7-option-annual-label">{opt.zeroBill ? 'Annual bill' : 'Annual cost'}</span>
                    <span className={`s7-option-annual-val${opt.zeroBill ? ' zero' : ''}`}>
                      {opt.zeroBill ? '$0' : `$${opt.annualCost.toLocaleString()}`}
                    </span>
                  </div>

                  {opt.annualCredit > 0 && (
                    <div className="s7-option-credit">
                      <span className="s7-option-credit-label">Annual credit</span>
                      <span className="s7-option-credit-val">+${opt.annualCredit.toLocaleString()}</span>
                    </div>
                  )}

                  {opt.fitRevenue > 0 && (
                    <div className="s7-option-fit">
                      <span className="s7-option-fit-label">Export revenue</span>
                      <span className="s7-option-fit-val">${opt.fitRevenue.toLocaleString()}/yr</span>
                    </div>
                  )}

                  <div className="s7-option-payback">
                    <span className="s7-option-payback-label">Payback</span>
                    <span className="s7-option-payback-val">{opt.paybackYear} yrs</span>
                  </div>

                  {opt.zeroBill && <div className="s7-option-zero-badge">{opt.annualCredit > 0 ? `$0 Bill + $${opt.annualCredit.toLocaleString()} credit` : '$0 Bill'}</div>}
                </div>
              )
            })}
          </div>
        </ScrollSection>
      )}

      {/* Guarantee */}
      <ScrollSection>
        <div className="s7-guarantee">
          <div className="s7-guarantee-icon">{'\ud83d\udee1\ufe0f'}</div>
          <div className="s7-guarantee-title">Your bill is <span className="green">guaranteed $0</span></div>
          <div className="s7-guarantee-text">We don&rsquo;t just estimate &mdash; we guarantee. Your system is oversized to {cfg.financial.coverageRatio}% of your usage, and if anything falls short, we pay the difference.</div>
          <div className="s7-guarantee-tag">&check; Bill-to-Zero Guarantee</div>
        </div>
      </ScrollSection>

      <ScrollSection>
        <div className="cta-section">
          <h2>Ready to go<br /><span className="highlight">Bill-to-Zero?</span></h2>
          <p>Let&rsquo;s review the assumptions behind your proposal.</p>
        </div>
      </ScrollSection>
    </div>
  )
}
