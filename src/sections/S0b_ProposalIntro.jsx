import { useProposal } from '../context/ProposalContext'
import ScrollSection from '../components/ScrollSection'
import '../styles/sections/s0b.css'

function SmallDiamond() {
  return (
    <svg className="proposal-hero-diamond" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 18 L24 10 L34 18 L24 38 Z" stroke="url(#dGrad2)" strokeWidth="1.2" fill="none" />
      <path d="M14 18 L34 18" stroke="url(#dGrad2)" strokeWidth="1.2" />
      <defs>
        <linearGradient id="dGrad2" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#e000f0" />
          <stop offset="100%" stopColor="#a020f0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function S0b_ProposalIntro() {
  const { state, dispatch } = useProposal()
  const { customer, rep, proposal } = state

  const fullName = `${customer.firstName} ${customer.lastName}`.trim() || 'Customer'
  const initials = `${(customer.firstName?.[0] || '').toUpperCase()}${(customer.lastName?.[0] || '').toUpperCase()}`
  const addressLine = [customer.address, customer.suburb, customer.state, customer.postcode].filter(Boolean).join(', ')
  const dailyUsage = parseFloat(customer.dailyUsage) || 0
  const tariffRate = parseFloat(customer.tariffRate) || 0
  const supplyCharge = parseFloat(customer.supplyCharge) || 0
  const quarterlyBill = parseFloat(customer.quarterlyBill) || 0
  const annualBill = quarterlyBill * 4
  const householdLabel = customer.householdSize === '1' ? '1 person' : `${customer.householdSize} people`
  const storeysLabel = customer.storeys === '1' ? 'Single Storey' : customer.storeys === '2' ? 'Two Storey' : 'Three Storey'

  const proposalDate = proposal.date
    ? new Date(proposal.date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div>
      {/* Hero */}
      <section className="proposal-hero">
        <SmallDiamond />
        <div className="proposal-hero-label">Your Proposal</div>
        <h1>Prepared for<br /><span className="highlight">{fullName}</span></h1>
        <p className="proposal-hero-sub">
          A personalised solar and battery solution designed around your home, your usage, and your goals.
        </p>
        <div className="proposal-hero-meta">
          <div className="proposal-hero-meta-item">{proposalDate}</div>
          <div className="proposal-hero-meta-divider"></div>
          <div className="proposal-hero-meta-item">Prepared by {rep.name || 'BDS'}</div>
        </div>
        <div className="scroll-cue"><span>Scroll</span><div className="arrow"></div></div>
      </section>

      {/* Profile Card */}
      <ScrollSection>
        <div className="section-label">Your Details</div>
        <div className="profile-card" style={{ position: 'relative' }}>
          <button className="edit-btn" onClick={() => dispatch({ type: 'EDIT_FORM' })}>&#9998; Edit</button>
          <div className="profile-header">
            <div className="profile-avatar-ring">
              <div className="profile-avatar">{initials}</div>
            </div>
            <div>
              <div className="profile-name">{fullName}</div>
              <div className="profile-address">{addressLine}</div>
            </div>
          </div>
          <div className="profile-details stagger-in visible">
            <div className="profile-detail-item">
              <div className="profile-detail-icon">&#127968;</div>
              <div><div className="profile-detail-label">Property</div><div className="profile-detail-value">{customer.propertyType}</div></div>
            </div>
            <div className="profile-detail-item">
              <div className="profile-detail-icon">&#128101;</div>
              <div><div className="profile-detail-label">Household</div><div className="profile-detail-value">{householdLabel}</div></div>
            </div>
            <div className="profile-detail-item">
              <div className="profile-detail-icon">&#128664;</div>
              <div><div className="profile-detail-label">EV Owner</div><div className="profile-detail-value">{customer.hasEV ? 'Yes' : 'No'}</div></div>
            </div>
            <div className="profile-detail-item">
              <div className="profile-detail-icon">&#127946;</div>
              <div><div className="profile-detail-label">Pool</div><div className="profile-detail-value">{customer.hasPool ? 'Yes' : 'No'}</div></div>
            </div>
            <div className="profile-detail-item">
              <div className="profile-detail-icon">&#9889;</div>
              <div><div className="profile-detail-label">Phase</div><div className="profile-detail-value">{customer.phase} Phase</div></div>
            </div>
            <div className="profile-detail-item">
              <div className="profile-detail-icon">&#127970;</div>
              <div><div className="profile-detail-label">Storeys</div><div className="profile-detail-value">{storeysLabel}</div></div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Energy Snapshot */}
      <ScrollSection>
        <div className="section-label">Current Energy Profile</div>
        <div className="snapshot-heading">Here is where you stand today</div>
        <div className="snapshot-sub">Based on your recent electricity bills, here is a snapshot of your current energy situation.</div>
        <div className="stats-grid stagger-in visible">
          <div className="stat-card">
            <div className="stat-card-label">Tariff Rate</div>
            <div className="stat-card-value solar">${tariffRate.toFixed(2)}</div>
            <div className="stat-card-unit">per kWh</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Supply Charge</div>
            <div className="stat-card-value accent">${supplyCharge.toFixed(2)}</div>
            <div className="stat-card-unit">per day</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Daily Usage</div>
            <div className="stat-card-value accent">{dailyUsage.toFixed(1)}</div>
            <div className="stat-card-unit">kWh / day</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Annual Bill</div>
            <div className="stat-card-value danger">${annualBill.toLocaleString()}</div>
            <div className="stat-card-unit">per year</div>
          </div>
        </div>
        <div className="section-label" style={{ marginTop: 48 }}>What We Will Show You</div>
        <div className="roadmap-heading">Your proposal at a glance</div>
        <div className="roadmap-sub">We have built this proposal to walk you through every detail, so you can make an informed decision with full confidence.</div>
        <div className="roadmap-steps stagger-in visible">
          <div className="roadmap-step">
            <div className="roadmap-step-number">01</div>
            <div className="roadmap-step-icon">
              <svg viewBox="0 0 32 32" fill="none" stroke="url(#rmGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <defs><linearGradient id="rmGrad" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stopColor="#e000f0" /><stop offset="100%" stopColor="#a020f0" /></linearGradient></defs>
                <polyline points="4 24 12 16 18 20 28 8" />
                <polyline points="22 8 28 8 28 14" />
              </svg>
            </div>
            <div className="roadmap-step-title">The Problem</div>
            <div className="roadmap-step-desc">Where your money is going and how rising electricity costs will impact you over the next 20 years.</div>
          </div>
          <div className="roadmap-step">
            <div className="roadmap-step-number">02</div>
            <div className="roadmap-step-icon">
              <svg viewBox="0 0 32 32" fill="none" stroke="url(#rmGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="16" cy="16" r="5" />
                <line x1="16" y1="3" x2="16" y2="7" />
                <line x1="16" y1="25" x2="16" y2="29" />
                <line x1="3" y1="16" x2="7" y2="16" />
                <line x1="25" y1="16" x2="29" y2="16" />
                <line x1="6.8" y1="6.8" x2="9.6" y2="9.6" />
                <line x1="22.4" y1="22.4" x2="25.2" y2="25.2" />
                <line x1="6.8" y1="25.2" x2="9.6" y2="22.4" />
                <line x1="22.4" y1="9.6" x2="25.2" y2="6.8" />
              </svg>
            </div>
            <div className="roadmap-step-title">Solar + Battery</div>
            <div className="roadmap-step-desc">How solar panels and a battery work together to cover your usage around the clock.</div>
          </div>
          <div className="roadmap-step">
            <div className="roadmap-step-number">03</div>
            <div className="roadmap-step-icon">
              <svg viewBox="0 0 32 32" fill="none" stroke="url(#rmGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16" y1="3" x2="16" y2="29" />
                <path d="M21 9 C21 7 19 5 16 5 C13 5 10 7 10 9.5 C10 12 12 13 16 14 C20 15 22 16.5 22 19.5 C22 22 19 24 16 24 C13 24 10 22 10 20" />
              </svg>
            </div>
            <div className="roadmap-step-title">Your Savings</div>
            <div className="roadmap-step-desc">A before-and-after comparison of your energy costs and the long-term financial picture.</div>
          </div>
          <div className="roadmap-step">
            <div className="roadmap-step-number">04</div>
            <div className="roadmap-step-icon">
              <svg viewBox="0 0 32 32" fill="none" stroke="url(#rmGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 6 18 14 18 11 30 26 12 17 12 22 2" />
              </svg>
            </div>
            <div className="roadmap-step-title">Your System</div>
            <div className="roadmap-step-desc">The exact hardware, warranties, and Bill-to-Zero guarantee tailored to your home.</div>
          </div>
        </div>
      </ScrollSection>

      {/* CTA */}
      <ScrollSection>
        <div className="cta-section">
          <h2>Let us show you the<br /><span className="highlight">path to $0</span></h2>
          <p>Everything in this proposal is based on your real usage data. No guesswork, no generic estimates.</p>
        </div>
      </ScrollSection>
    </div>
  )
}
