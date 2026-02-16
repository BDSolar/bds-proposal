import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import systemConfig from '../data/systemConfig'
import '../styles/sections/s7.css'

const cfg = systemConfig

export default function S7_YourSystem() {
  return (
    <div>
      <Hero badge="Section 07 — Your System" title="Meet your" highlightText="system" subtitle="Premium components, engineered to 150% of your usage. Here's exactly what powers your Bill-to-Zero home." />

      {/* Product Cards */}
      <ScrollSection>
        <div className="section-label">Your Components</div>
        <div className="s7-product-grid">
          {/* Panel Card */}
          <div className="s7-product-card solar-top">
            <div className="s7-product-header">
              <div className="s7-product-brand">{cfg.system.panelBrand}</div>
              <div className="s7-product-model">{cfg.system.panelModel} {cfg.system.panelSeries}</div>
            </div>
            <div className="s7-product-illustration">
              <svg viewBox="0 0 200 220" className="s7-panel-svg">
                <rect x="20" y="15" width="160" height="190" rx="4" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
                {[0, 1, 2].map(col => [0, 1, 2, 3].map(row => (
                  <rect key={`${col}-${row}`} x={28 + col * 52} y={23 + row * 44} width="48" height="40" rx="2" fill="#2a2015" stroke="#3a3020" strokeWidth="0.5" opacity="0.8" />
                )))}
                <rect x="28" y="23" width="48" height="40" rx="2" fill="#3a2a15" opacity="0.9" />
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
              <div className="s7-product-brand">{cfg.battery.brand}</div>
              <div className="s7-product-model">{cfg.battery.model}</div>
            </div>
            <div className="s7-product-illustration">
              <svg viewBox="0 0 200 220" className="s7-battery-svg">
                {/* Controller */}
                <rect x="30" y="20" width="140" height="38" rx="4" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
                <rect x="30" y="20" width="140" height="4" rx="2" fill="#388cff" opacity="0.6" />
                <circle cx="100" cy="39" r="5" fill="#388cff" className="s7-eye-pulse" />
                {/* Modules */}
                {[0, 1, 2, 3].map(i => (
                  <g key={i}>
                    <rect x="30" y={68 + i * 38} width="140" height="34" rx="4" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
                    <rect x="36" y={78 + i * 38} width={90 - i * 20} height="14" rx="3" fill="#30d158" opacity={0.3 + i * 0.05} className="s7-charge-bar" style={{ animationDelay: `${1.5 + i * 0.5}s` }} />
                    <text x="165" y={89 + i * 38} fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="var(--text-tertiary)" textAnchor="end">{cfg.battery.capacityPerModule} kWh</text>
                  </g>
                ))}
              </svg>
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
      </ScrollSection>

      {/* System Stats */}
      <ScrollSection>
        <div className="section-label">System Overview</div>
        <div className="s7-system-stats">
          <div className="s7-sys-stat"><div className="stat-value accent">{cfg.system.arrayKw} kW</div><div className="stat-label">Solar Capacity</div></div>
          <div className="s7-sys-stat"><div className="stat-value green">{cfg.battery.totalCapacityKwh} kWh</div><div className="stat-label">Battery Storage</div></div>
          <div className="s7-sys-stat"><div className="stat-value solar-color">{Math.round(cfg.system.dailyProduction)} kWh</div><div className="stat-label">Daily Production</div></div>
          <div className="s7-sys-stat"><div className="stat-value yellow">{cfg.financial.coverageRatio}%</div><div className="stat-label">Usage Coverage</div></div>
        </div>
      </ScrollSection>

      {/* Energy Flow */}
      <ScrollSection>
        <div className="section-label">Energy Flow</div>
        <div className="s7-flow-section">
          <div className="s7-flow-title">Daytime</div>
          <div className="s7-flow-row">
            {[
              { icon: '\u2600\ufe0f', label: 'Panels', detail: `${Math.round(cfg.system.dailyProduction)} kWh/day`, cls: 'solar' },
              { icon: '\u26a1', label: 'Controller', detail: 'Manages flow', cls: 'accent' },
              { icon: '\ud83d\udd0b', label: 'Battery', detail: 'Charging', cls: 'battery' },
              { icon: '\ud83c\udfe0', label: 'Home', detail: 'Self-powered', cls: '' },
              { icon: '\u2197\ufe0f', label: 'Grid', detail: 'Exporting surplus', cls: '' },
            ].map((node, i) => (
              <div key={i} className="s7-flow-node-wrap">
                {i > 0 && <div className={`s7-flow-connector ${node.cls}`} />}
                <div className={`s7-flow-node ${node.cls}`}>
                  <div className="s7-flow-icon">{node.icon}</div>
                  <div className="s7-flow-label">{node.label}</div>
                  <div className="s7-flow-detail">{node.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="s7-flow-title" style={{ marginTop: 32 }}>Nighttime</div>
          <div className="s7-flow-row">
            {[
              { icon: '\ud83d\udd0b', label: 'Battery', detail: 'Discharging', cls: 'battery' },
              { icon: '\u26a1', label: 'Controller', detail: 'Manages flow', cls: 'accent' },
              { icon: '\ud83c\udfe0', label: 'Home', detail: 'Powered by battery', cls: '' },
              { icon: '\ud83d\ude97', label: 'EV', detail: `${cfg.battery.evChargerKw} kW DC`, cls: 'battery' },
            ].map((node, i) => (
              <div key={i} className="s7-flow-node-wrap">
                {i > 0 && <div className={`s7-flow-connector ${node.cls}`} />}
                <div className={`s7-flow-node ${node.cls}`}>
                  <div className="s7-flow-icon">{node.icon}</div>
                  <div className="s7-flow-label">{node.label}</div>
                  <div className="s7-flow-detail">{node.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollSection>

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
