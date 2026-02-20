import { useState, useCallback, useMemo, useRef } from 'react'
import { useProposal } from '../context/ProposalContext'
import { useReps } from '../hooks/useReps'
import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import systemConfig from '../data/systemConfig'
import { getShareUrl } from '../utils/proposalUrl'
// PDF export is lazy-loaded on demand to avoid bundling jsPDF in the main chunk
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
          ...(a.solar.summerDailyProduction ? [['Summer Production', `${a.solar.summerDailyProduction} kWh/day`], ['Winter Production', `${a.solar.winterDailyProduction} kWh/day`]] : []),
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

function EmailCapture({ firstName }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const inputRef = useRef(null)

  function handleSend() {
    if (!email || !email.includes('@')) {
      inputRef.current?.focus()
      return
    }
    window.location.href = `mailto:${email}?subject=Your%20Solar%20Proposal%20from%20Black%20Diamond%20Solar&body=Hi%20${firstName || ''},%0A%0AHere%20is%20your%20personalised%20solar%20proposal%20from%20Black%20Diamond%20Solar.`
    setSent(true)
  }

  if (sent) {
    return <div className="s8-cta-email-sent">Proposal sent to {email}</div>
  }

  return (
    <div className="s8-cta-email-capture">
      <input
        ref={inputRef}
        type="email"
        className="s8-cta-email-input"
        placeholder="Enter email to send proposal"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSend()}
      />
      <button className="s8-cta-email-send" onClick={handleSend}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        Send
      </button>
    </div>
  )
}

function ShareLink({ state }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = getShareUrl(state)
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <button className="s8-share-link" onClick={handleCopy}>
      {copied ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#30d158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          Link copied
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
          Copy proposal link
        </>
      )}
    </button>
  )
}

function DownloadPdfButton({ state }) {
  const [generating, setGenerating] = useState(false)

  async function handleDownload() {
    setGenerating(true)
    try {
      const { generateProposalPdf } = await import('../utils/pdfExport')
      await generateProposalPdf(state)
    } catch (e) {
      console.error('PDF generation failed:', e)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button className="s8-cta-secondary" onClick={handleDownload} disabled={generating}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
      {generating ? 'Generating...' : 'Download Proposal PDF'}
    </button>
  )
}

const ChevronDown = () => (
  <svg className="s8-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export default function S8_Assumptions() {
  const { state } = useProposal()
  const er = state.engineResults
  const { reps } = useReps()
  const [openId, setOpenId] = useState(null)

  const accordionSections = useMemo(() => {
    return buildAccordionSections(cfg, er) || STATIC_ACCORDION_SECTIONS
  }, [er])

  const toggle = useCallback((id) => {
    setOpenId(prev => prev === id ? null : id)
  }, [])

  return (
    <div>
      <Hero badge="Section 08 \u2014 Transparency" title={state.customer.firstName ? `${state.customer.firstName}, no` : 'No'} highlightText="black boxes" subtitle="Every number in your proposal is backed by real data. Here\u2019s exactly how we calculated your system, your savings, and your $0 bill." />

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

      {/* Cooling-off notice */}
      <ScrollSection>
        <div className="s8-cooling-off">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l2 2" /></svg>
          <div className="s8-cooling-off-text">
            <strong>10-Day Cooling-Off Period</strong> &mdash; Under the Australian Consumer Law, you have 10 business days to cancel any agreement signed at your home, with a full refund. No questions asked.
          </div>
        </div>
      </ScrollSection>

      {/* Terminal CTA Block */}
      <ScrollSection>
        <div className="s8-cta-block">
          <div className="s8-cta-heading">Your next step</div>
          <div className="s8-cta-subheading">You&rsquo;ve seen the data. You&rsquo;ve seen the numbers. The only question left is <strong>when</strong>.</div>

          {/* Rep Card */}
          {(() => {
            const selectedRep = reps.find(r => r.name === state.rep.name && r.photo_url)
            if (!selectedRep) return null
            return (
              <div className="s8-rep-card">
                <div className="s8-rep-photo">
                  <img src={selectedRep.photo_url} alt={selectedRep.name} />
                </div>
                <div className="s8-rep-info">
                  <div className="s8-rep-label">Your energy consultant</div>
                  <div className="s8-rep-name">{selectedRep.name}</div>
                  <div className="s8-rep-title">{selectedRep.title}</div>
                </div>
              </div>
            )
          })()}

          {/* Action Buttons */}
          <div className="s8-cta-actions">
            <a href="#book" className="s8-cta-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              Book Your Installation Survey
            </a>
            {state.customer.email ? (
              <a href={`mailto:${state.customer.email}?subject=Your%20Solar%20Proposal%20from%20Black%20Diamond%20Solar&body=Hi%20${state.customer.firstName || ''},%0A%0AHere%20is%20your%20personalised%20solar%20proposal%20from%20Black%20Diamond%20Solar.`} className="s8-cta-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                Send to {state.customer.email}
              </a>
            ) : (
              <EmailCapture firstName={state.customer.firstName} />
            )}
            <DownloadPdfButton state={state} />
          </div>
          {state.customer.phone && (
            <div className="s8-cta-phone-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
              Your rep will call <strong>{state.customer.phone}</strong> to discuss next steps
            </div>
          )}

          {/* Next Steps Timeline */}
          <div className="s8-next-steps">
            <div className="s8-step">
              <div className="s8-step-number">1</div>
              <div className="s8-step-content">
                <div className="s8-step-title">Site Survey</div>
                <div className="s8-step-desc">We visit your home to finalise the design</div>
              </div>
            </div>
            <div className="s8-step">
              <div className="s8-step-number">2</div>
              <div className="s8-step-content">
                <div className="s8-step-title">Final Design</div>
                <div className="s8-step-desc">Your system layout confirmed and approved</div>
              </div>
            </div>
            <div className="s8-step">
              <div className="s8-step-number">3</div>
              <div className="s8-step-content">
                <div className="s8-step-title">Installation</div>
                <div className="s8-step-desc">Typical install: 1&ndash;2 days, fully operational</div>
              </div>
            </div>
          </div>
          <div className="s8-timeline-note">Most installations are completed within 4&ndash;6 weeks of approval.</div>
          <ShareLink state={state} />
        </div>
      </ScrollSection>
    </div>
  )
}
