import { useState, useCallback, useMemo } from 'react'
import { useProposal } from '../context/ProposalContext'
import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import systemConfig from '../data/systemConfig'
import '../styles/sections/s8.css'

function buildAccordionSections(cfg, er) {
  // Use engine assumptions if available, otherwise fall back to static config
  if (er) {
    const a = er.assumptions
    return [
      {
        id: 'tariff', icon: '\u26a1', iconClass: 'icon-tariff',
        title: 'Electricity Tariff', desc: 'Your current rates and pricing structure',
        rows: [
          ['Import Rate', `$${a.tariff.rate.toFixed(2)}/kWh`],
          ['Daily Supply Charge', `$${a.tariff.supply.toFixed(2)}/day`],
          ['Feed-in Tariff (Export)', `$${a.tariff.fit.toFixed(2)}/kWh`],
          ['Tariff Type', a.tariff.tariffType],
          ['Distribution Network', a.tariff.network],
          ['Retailer', a.tariff.retailer],
        ],
        note: 'Based on your current electricity retailer plan. Rates are inclusive of GST.',
      },
      {
        id: 'solar', icon: '\u2600\ufe0f', iconClass: 'icon-solar',
        title: 'Solar Production', desc: 'How we estimate your system\u2019s output',
        rows: [
          ['Panel', `${a.solar.brand} ${a.solar.model}`],
          ['Panel Wattage', `${a.solar.wattage}W`],
          ['Number of Panels', `\u00d7 ${a.solar.panelCount}`],
          ['Total System Size', `${a.solar.totalKw} kW`],
          ['Panel Efficiency', `${a.solar.efficiency}%`],
          ['Cell Technology', `${a.solar.technology}`],
          ['Orientation / Tilt', `${a.solar.orientation}, ${a.solar.tilt}\u00b0`],
          ['Peak Sun Hours', `${a.solar.peakSunHours} hrs/day`],
          ['Daily Production (Yr 1)', `${a.solar.dailyProduction} kWh`],
          ['Annual Production (Yr 1)', `${a.solar.annualProduction.toLocaleString()} kWh`],
          ['System Losses', `${a.solar.systemLosses}%`],
          ['Location', a.solar.location],
        ],
        note: 'Solar irradiance data is sourced from the Bureau of Meteorology. Production estimates account for real-world losses.',
      },
      {
        id: 'battery', icon: '\ud83d\udd0b', iconClass: 'icon-battery',
        title: 'Battery & Storage', desc: 'Storage capacity and performance specs',
        rows: [
          ['Battery System', `${a.battery.brand} ${a.battery.model}`],
          ['Total Capacity', `${a.battery.totalCapacity} kWh`],
          ['Usable Capacity', `${a.battery.usableCapacity} kWh`],
          ['Modules', `${a.battery.modules} \u00d7 ${a.battery.capacityPerModule} kWh`],
          ['Chemistry', a.battery.chemistry],
          ['Cycle Life', a.battery.cycles],
          ['Hybrid Inverter', `${a.battery.inverterSize} kW`],
          ['DC EV Charger', `${a.battery.evChargerKw} kW`],
          ['Round-Trip Efficiency', `${a.battery.roundTripEfficiency}%`],
          ['Depth of Discharge', `${a.battery.depthOfDischarge}%`],
        ],
        note: 'Manufacturer specifications from SigEnergy.',
      },
      {
        id: 'degradation', icon: '\ud83d\udcc9', iconClass: 'icon-degradation',
        title: 'Degradation & Longevity', desc: 'How performance changes over time',
        rows: [
          ['Solar Degradation', `${a.degradation.solar}% per year`],
          ['Solar Output at Year 25', `\u2265 ${(100 - a.degradation.solar * 25).toFixed(1)}%`],
          ['Battery Degradation', `${a.degradation.battery}% per year`],
        ],
        note: 'Our 150% oversizing means degradation won\u2019t impact your $0 bill outcome.',
      },
      {
        id: 'financial', icon: '\ud83d\udcb0', iconClass: 'icon-financial',
        title: 'Financial Projections', desc: 'Cost escalation and savings methodology',
        rows: [
          ['System Cost (installed)', `$${a.financial.systemCost.toLocaleString()}`],
          ['Annual Usage', `${a.financial.annualUsage.toLocaleString()} kWh/yr`],
          ['Electricity Escalation Rate', `${(a.tariff.escalation * 100).toFixed(0)}% per year`],
          ['Projection Period', `${a.financial.years} years`],
        ],
        note: 'Historical electricity price increases in Australia have averaged 5\u20137% per year.',
      },
      {
        id: 'guarantee', icon: '\u2705', iconClass: 'icon-guarantee',
        title: 'Bill-to-Zero Guarantee', desc: 'How the guarantee works',
        rows: [
          ['System Oversizing', `${a.guarantee.coverageRatio}% of usage`],
          ['Guaranteed Electricity Bill', `$0`],
          ['Guarantee Provider', 'Black Diamond Solar'],
          ['What If Bill \u2260 $0?', 'BDS pays the remaining balance'],
        ],
        note: a.guarantee.guarantee,
      },
    ]
  }
  // Fall back to static config
  return null
}

const cfg = systemConfig

const STATIC_ACCORDION_SECTIONS = [
  {
    id: 'tariff',
    icon: '\u26a1',
    iconClass: 'icon-tariff',
    title: 'Electricity Tariff',
    desc: 'Your current rates and pricing structure',
    rows: [
      ['Import Rate', `$${cfg.tariff.rate.toFixed(2)}/kWh`],
      ['Daily Supply Charge', `$${cfg.tariff.supply.toFixed(2)}/day`],
      ['Feed-in Tariff (Export)', `$${cfg.tariff.fit.toFixed(2)}/kWh`],
      ['Tariff Type', cfg.tariff.tariffType],
      ['Distribution Network', cfg.tariff.network],
      ['Retailer', cfg.tariff.retailer],
    ],
    note: 'Based on your current electricity retailer plan. Rates are inclusive of GST. If your tariff changes, we\u2019ll update your proposal accordingly.',
  },
  {
    id: 'solar',
    icon: '\u2600\ufe0f',
    iconClass: 'icon-solar',
    title: 'Solar Production',
    desc: 'How we estimate your system\u2019s output',
    rows: [
      ['Panel', `${cfg.system.panelBrand} ${cfg.system.panelModel} ${cfg.system.panelSeries}`],
      ['Panel Wattage', `${cfg.system.panelWp}W`],
      ['Number of Panels', `\u00d7 ${cfg.system.panelCount}`],
      ['Total System Size', `${cfg.system.arrayKw} kW`],
      ['Panel Efficiency', `${cfg.system.panelEfficiency}%`],
      ['Cell Technology', `${cfg.system.panelTechnology} ${cfg.system.panelCellType}`],
      ['Orientation / Tilt', `${cfg.system.orientation}, ${cfg.system.tilt}\u00b0`],
      ['Peak Sun Hours', `${cfg.system.peakSunHours} hrs/day`],
      ['Daily Production (Yr 1)', `${cfg.system.dailyProduction} kWh`],
      ['Annual Production (Yr 1)', `${cfg.system.annualProduction.toLocaleString()} kWh`],
      ['System Losses', `${cfg.system.systemLosses}%`],
    ],
    note: 'Solar irradiance data is sourced from the Bureau of Meteorology and PVWatts for your location. Production estimates are conservative and account for real-world losses including temperature, shading, and soiling.',
  },
  {
    id: 'battery',
    icon: '\ud83d\udd0b',
    iconClass: 'icon-battery',
    title: 'Battery & Storage',
    desc: 'Storage capacity and performance specs',
    rows: [
      ['Battery System', `${cfg.battery.brand} ${cfg.battery.model}`],
      ['Total Capacity', `${cfg.battery.totalCapacityKwh} kWh`],
      ['Usable Capacity', `${cfg.battery.usableCapacityKwh} kWh`],
      ['Modules', `${cfg.battery.modules} \u00d7 ${cfg.battery.capacityPerModule} kWh`],
      ['Chemistry', cfg.battery.chemistry],
      ['Cycle Life', cfg.battery.cycles],
      ['Hybrid Inverter', `${cfg.battery.inverterSize} kW`],
      ['DC EV Charger', `${cfg.battery.evChargerKw} kW`],
      ['Round-Trip Efficiency', `${Math.round(cfg.battery.efficiency * 100)}%`],
      ['Depth of Discharge', `${cfg.battery.depthOfDischarge}%`],
      ['Warranty', cfg.battery.warranty],
    ],
    note: 'Manufacturer specifications from SigEnergy. Usable capacity accounts for depth-of-discharge limits to preserve battery longevity.',
  },
  {
    id: 'degradation',
    icon: '\ud83d\udcc9',
    iconClass: 'icon-degradation',
    title: 'Degradation & Longevity',
    desc: 'How performance changes over time',
    rows: [
      ['Solar Degradation', `${cfg.system.panelDegradation}% per year`],
      ['Solar Output at Year 25', `\u2265 ${(100 - cfg.system.panelDegradation * 25).toFixed(1)}%`],
      ['Battery Degradation', `${cfg.battery.degradationAnnual}% per year`],
      ['Battery Capacity at Year 10', `\u2265 ${cfg.battery.capacityYear10}%`],
      ['Panel Product Warranty', `${cfg.system.panelWarrantyProduct} years`],
      ['Panel Performance Warranty', `${cfg.system.panelWarrantyPerformance} years`],
      ['Battery Warranty', cfg.battery.warranty],
    ],
    note: 'LONGi\u2019s 30-year performance warranty guarantees minimum output levels. Our 150% oversizing means degradation won\u2019t impact your $0 bill outcome for the life of the system.',
  },
  {
    id: 'financial',
    icon: '\ud83d\udcb0',
    iconClass: 'icon-financial',
    title: 'Financial Projections',
    desc: 'Cost escalation and savings methodology',
    rows: [
      ['System Cost (installed)', `$${cfg.financial.systemCost.toLocaleString()}`],
      ['Daily Usage', `${cfg.financial.dailyUsage} kWh/day`],
      ['Annual Usage', `${cfg.financial.annualUsage.toLocaleString()} kWh/yr`],
      ['Electricity Escalation Rate', `${(cfg.tariff.escalation * 100).toFixed(0)}% per year`],
      ['Projection Period', `${cfg.financial.projectionYears} years`],
      ['Start Year', cfg.financial.startYear],
      ['System Coverage Ratio', `${cfg.financial.coverageRatio}%`],
      ['Self-Consumption Rate', `${cfg.financial.selfConsumption}%`],
      ['Daily Export', `${cfg.financial.exportKwhDaily} kWh/day`],
    ],
    note: 'Historical electricity price increases in Australia have averaged 5\u20137% per year over the past decade. Our assumption is conservative. Savings projections do not include potential future feed-in tariff changes or time-of-use arbitrage gains.',
  },
  {
    id: 'guarantee',
    icon: '\u2705',
    iconClass: 'icon-guarantee',
    title: 'Bill-to-Zero Guarantee',
    desc: 'How the guarantee works and what\u2019s covered',
    rows: [
      ['System Oversizing', `${cfg.guarantee.coverageRatio}% of usage`],
      ['Guaranteed Electricity Bill', `$${cfg.guarantee.guaranteedBill}`],
      ['Guarantee Provider', cfg.guarantee.provider],
      ['What If Bill \u2260 $0?', 'BDS pays the remaining balance'],
      ['Fine Print', 'None \u2014 no catches'],
    ],
    note: 'Your system is engineered to produce 150% of your energy needs. If for any reason the system doesn\u2019t zero your bill, Black Diamond Solar pays the remaining balance. It\u2019s that simple.',
  },
]

const ChevronDown = () => (
  <svg className="s8-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export default function S8_Assumptions() {
  const { state } = useProposal()
  const er = state.engineResults
  const [openId, setOpenId] = useState(null)

  const accordionSections = useMemo(() => {
    return buildAccordionSections(cfg, er) || STATIC_ACCORDION_SECTIONS
  }, [er])

  const toggle = useCallback((id) => {
    setOpenId(prev => prev === id ? null : id)
  }, [])

  return (
    <div>
      <Hero badge="Section 08 \u2014 Transparency" title="No" highlightText="black boxes" subtitle="Every number in your proposal is backed by real data. Here\u2019s exactly how we calculated your system, your savings, and your $0 bill." />

      <ScrollSection>
        <div className="section-label">Assumptions</div>
        <div className="s8-accordion-group">
          {accordionSections.map(section => (
            <div
              key={section.id}
              className={`s8-accordion-item${openId === section.id ? ' open' : ''}`}
            >
              <div className="s8-accordion-header" onClick={() => toggle(section.id)}>
                <div className={`s8-accordion-icon ${section.iconClass}`}>{section.icon}</div>
                <div className="s8-accordion-header-text">
                  <div className="s8-accordion-title">{section.title}</div>
                  <div className="s8-accordion-desc">{section.desc}</div>
                </div>
                <ChevronDown />
              </div>
              <div className="s8-accordion-body">
                <div className="s8-accordion-content">
                  <div className="s8-data-table">
                    {section.rows.map(([label, value]) => (
                      <div key={label} className="s8-data-row">
                        <span className="s8-data-label">{label}</span>
                        <span className="s8-data-value">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="s8-data-note">
                    <strong>Source:</strong> {section.note}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollSection>

      {/* Guarantee callout */}
      <ScrollSection>
        <div className="s8-guarantee-callout">
          <div className="s8-guarantee-icon">{'\ud83d\udee1\ufe0f'}</div>
          <div className="s8-guarantee-title">Your bill is <span className="green">guaranteed $0</span></div>
          <div className="s8-guarantee-text">We don&rsquo;t just estimate &mdash; we guarantee. Your system is oversized to {er ? er.system.coverageRatio : cfg.financial.coverageRatio}% of your usage, and if anything falls short, we pay the difference. No asterisks, no exceptions.</div>
          <div className="s8-guarantee-tag">&check; Bill-to-Zero Guarantee</div>
        </div>
      </ScrollSection>

      <ScrollSection>
        <div className="cta-section">
          <h2>Ready to go<br /><span className="highlight">Bill-to-Zero?</span></h2>
          <p>You&rsquo;ve seen the data. You&rsquo;ve seen the system. Let&rsquo;s make it happen.</p>
        </div>
      </ScrollSection>
    </div>
  )
}
