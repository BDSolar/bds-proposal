import { useState, useRef } from 'react'
import { useProposal } from '../context/ProposalContext'
import { useReps } from '../hooks/useReps'
import '../styles/sections/s0b.css'

function SmallDiamond() {
  return (
    <svg className="form-hero-diamond" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 18 L24 10 L34 18 L24 38 Z" stroke="url(#dGrad)" strokeWidth="1.2" fill="none" />
      <path d="M14 18 L34 18" stroke="url(#dGrad)" strokeWidth="1.2" />
      <defs>
        <linearGradient id="dGrad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#e000f0" />
          <stop offset="100%" stopColor="#a020f0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function S0b_DataCapture() {
  const { state, dispatch } = useProposal()
  const { customer, rep, proposal } = state
  const { reps, loading: repsLoading } = useReps()

  function updateCustomer(field, value) {
    dispatch({ type: 'UPDATE_CUSTOMER', payload: { [field]: value } })
  }

  function toggleFeature(field) {
    dispatch({ type: 'UPDATE_CUSTOMER', payload: { [field]: !customer[field] } })
  }

  const [errors, setErrors] = useState({})
  const sessionRestored = useRef(customer.firstName !== '' || customer.dailyUsage !== '').current

  function handleSubmit() {
    const newErrors = {}
    const usage = parseFloat(customer.dailyUsage)
    const tariff = parseFloat(customer.tariffRate)
    const supply = parseFloat(customer.supplyCharge)

    if (!customer.dailyUsage || isNaN(usage) || usage <= 0) {
      newErrors.dailyUsage = 'Please enter your daily usage (found on your electricity bill)'
    }
    if (!customer.tariffRate || isNaN(tariff) || tariff <= 0) {
      newErrors.tariffRate = 'Please enter your tariff rate (usually between $0.20 and $0.50 per kWh)'
    }
    if (!customer.supplyCharge || isNaN(supply) || supply <= 0) {
      newErrors.supplyCharge = 'Please enter your daily supply charge (usually between $0.80 and $2.00)'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    dispatch({ type: 'SUBMIT_FORM' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="form-hero">
        <SmallDiamond />
        <div className="form-hero-label">Getting Started</div>
        <h1>Let&rsquo;s build <span className="highlight">your proposal</span></h1>
        <p className="form-hero-sub">
          Confirm the customer details and enter their energy information to generate a personalised solar proposal.
        </p>
      </div>

      <section className="scroll-section auto-height">
        <div className="section-inner form-visible">
          {sessionRestored && (
            <div className="form-session-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></svg>
              <span>Previous session restored{customer.firstName ? ` for ${customer.firstName} ${customer.lastName}` : ''}.</span>
              <button className="form-session-clear" onClick={() => dispatch({ type: 'RESET' })}>Start Fresh</button>
            </div>
          )}
          {/* Rep Details */}
          <div className="form-card accent-top">
            <div className="form-card-title">Your Details</div>
            <div className="form-card-desc">Who is presenting this proposal?</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Rep Name</label>
                <select
                  className="form-select"
                  value={rep.name}
                  onChange={e => dispatch({ type: 'UPDATE_REP', payload: { name: e.target.value } })}
                >
                  {repsLoading ? (
                    <option disabled>Loading...</option>
                  ) : (
                    <>
                      <option value="" disabled>Select rep...</option>
                      {reps.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Proposal Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={proposal.date}
                  onChange={e => dispatch({ type: 'UPDATE_PROPOSAL', payload: { date: e.target.value } })}
                />
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="form-card accent-top">
            <div className="form-card-title">Customer Details</div>
            <div className="form-card-desc">Pre-fill what you know. Validate the rest with the customer.</div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" className="form-input" placeholder="e.g. Sarah" value={customer.firstName} onChange={e => updateCustomer('firstName', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-input" placeholder="e.g. Mitchell" value={customer.lastName} onChange={e => updateCustomer('lastName', e.target.value)} />
              </div>
            </div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group form-full">
                <label className="form-label">Street Address</label>
                <input type="text" className="form-input" placeholder="e.g. 42 Panorama Drive" value={customer.address} onChange={e => updateCustomer('address', e.target.value)} />
              </div>
            </div>
            <div className="form-grid-3" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Suburb</label>
                <input type="text" className="form-input" placeholder="e.g. Carindale" value={customer.suburb} onChange={e => updateCustomer('suburb', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select className="form-select" value={customer.state} onChange={e => updateCustomer('state', e.target.value)}>
                  <option value="QLD">QLD</option>
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="SA">SA</option>
                  <option value="WA">WA</option>
                  <option value="TAS">TAS</option>
                  <option value="NT">NT</option>
                  <option value="ACT">ACT</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Postcode</label>
                <input type="text" className="form-input" placeholder="e.g. 4152" maxLength="4" value={customer.postcode} onChange={e => updateCustomer('postcode', e.target.value)} />
              </div>
            </div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="e.g. sarah@email.com" value={customer.email} onChange={e => updateCustomer('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-input" placeholder="e.g. 0412 345 678" value={customer.phone} onChange={e => updateCustomer('phone', e.target.value)} />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Property Type</label>
                <select className="form-select" value={customer.propertyType} onChange={e => updateCustomer('propertyType', e.target.value)}>
                  <option value="House">House</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Unit">Unit</option>
                  <option value="Duplex">Duplex</option>
                  <option value="Acreage">Acreage</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Household Size</label>
                <select className="form-select" value={customer.householdSize} onChange={e => updateCustomer('householdSize', e.target.value)}>
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="3">3 people</option>
                  <option value="4">4 people</option>
                  <option value="5">5 people</option>
                  <option value="6">6+ people</option>
                </select>
              </div>
            </div>
          </div>

          {/* Energy Profile */}
          <div className="form-card solar-top">
            <div className="form-card-title">Energy Profile</div>
            <div className="form-card-desc">Enter the customer&rsquo;s usage data from their electricity bill.</div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Daily Usage</label>
                <div className="input-with-unit">
                  <input type="number" className={`form-input${errors.dailyUsage ? ' form-input-error' : ''}`} placeholder="e.g. 30" step="0.1" value={customer.dailyUsage} onChange={e => { updateCustomer('dailyUsage', e.target.value); setErrors(prev => ({ ...prev, dailyUsage: undefined })) }} />
                  <span className="input-unit">kWh/day</span>
                </div>
                <span className="form-helper">Found on page 2 of most bills as &lsquo;Average Daily Usage&rsquo;</span>
                {errors.dailyUsage && <span className="form-error">{errors.dailyUsage}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Quarterly Bill</label>
                <div className="input-with-unit">
                  <input type="number" className="form-input" placeholder="e.g. 967" step="1" value={customer.quarterlyBill} onChange={e => updateCustomer('quarterlyBill', e.target.value)} />
                  <span className="input-unit">$ / qtr</span>
                </div>
              </div>
            </div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Tariff Rate</label>
                <div className="input-with-unit">
                  <input type="number" className={`form-input${errors.tariffRate ? ' form-input-error' : ''}`} placeholder="e.g. 0.32" step="0.01" value={customer.tariffRate} onChange={e => { updateCustomer('tariffRate', e.target.value); setErrors(prev => ({ ...prev, tariffRate: undefined })) }} />
                  <span className="input-unit">$/kWh</span>
                </div>
                <span className="form-helper">Check your bill under &lsquo;Usage Charges&rsquo; or &lsquo;Tariff Rate&rsquo;</span>
                {errors.tariffRate && <span className="form-error">{errors.tariffRate}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Supply Charge</label>
                <div className="input-with-unit">
                  <input type="number" className={`form-input${errors.supplyCharge ? ' form-input-error' : ''}`} placeholder="e.g. 1.10" step="0.01" value={customer.supplyCharge} onChange={e => { updateCustomer('supplyCharge', e.target.value); setErrors(prev => ({ ...prev, supplyCharge: undefined })) }} />
                  <span className="input-unit">$/day</span>
                </div>
                <span className="form-helper">Listed as &lsquo;Service to Property&rsquo; or &lsquo;Daily Supply Charge&rsquo;</span>
                {errors.supplyCharge && <span className="form-error">{errors.supplyCharge}</span>}
              </div>
            </div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Feed-in Tariff</label>
                <div className="input-with-unit">
                  <input type="number" className="form-input" placeholder="e.g. 0.07" step="0.01" value={customer.fitRate} onChange={e => updateCustomer('fitRate', e.target.value)} />
                  <span className="input-unit">$/kWh</span>
                </div>
                <span className="form-helper">Your export rate. Leave blank for state default.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Roof Orientation</label>
                <select className="form-select" value={customer.roofOrientation} onChange={e => updateCustomer('roofOrientation', e.target.value)}>
                  <option value="North">North (100%)</option>
                  <option value="North-East">North-East (95%)</option>
                  <option value="North-West">North-West (95%)</option>
                  <option value="East">East (85%)</option>
                  <option value="West">West (85%)</option>
                  <option value="South-East">South-East (80%)</option>
                  <option value="South-West">South-West (80%)</option>
                  <option value="Mixed">Mixed / Split (90%)</option>
                </select>
                <span className="form-helper">Primary panel-facing direction</span>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Electricity Phase</label>
                <select className="form-select" value={customer.phase} onChange={e => updateCustomer('phase', e.target.value)}>
                  <option value="Single">Single Phase</option>
                  <option value="Three">Three Phase</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Storeys</label>
                <select className="form-select" value={customer.storeys} onChange={e => updateCustomer('storeys', e.target.value)}>
                  <option value="1">Single Storey</option>
                  <option value="2">Two Storey</option>
                  <option value="3">Three Storey</option>
                </select>
              </div>
            </div>
          </div>

          {/* Property Features */}
          <div className="form-card battery-top">
            <div className="form-card-title">Property Features</div>
            <div className="form-card-desc">Does the property have any of the following?</div>
            <div className="form-grid">
              <div className={`toggle-row${customer.hasEV ? ' active' : ''}`} onClick={() => toggleFeature('hasEV')}>
                <span className="toggle-label-text">&#128664; Electric Vehicle</span>
                <div className="toggle-switch"></div>
              </div>
              <div className={`toggle-row${customer.hasPool ? ' active' : ''}`} onClick={() => toggleFeature('hasPool')}>
                <span className="toggle-label-text">&#127946; Swimming Pool</span>
                <div className="toggle-switch"></div>
              </div>
              <div className={`toggle-row${customer.hasAC ? ' active' : ''}`} onClick={() => toggleFeature('hasAC')}>
                <span className="toggle-label-text">&#10052;&#65039; Ducted Air Con</span>
                <div className="toggle-switch"></div>
              </div>
              <div className={`toggle-row${customer.hasHotWater ? ' active' : ''}`} onClick={() => toggleFeature('hasHotWater')}>
                <span className="toggle-label-text">&#128167; Electric Hot Water</span>
                <div className="toggle-switch"></div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-card accent-top">
            <div className="form-card-title">Notes</div>
            <div className="form-card-desc">Anything else to note about the property or customer?</div>
            <div className="form-group">
              <textarea
                className="form-input"
                rows="3"
                placeholder="e.g. Shading on north-west corner, roof access via back lane..."
                style={{ resize: 'vertical', minHeight: 80 }}
                value={customer.notes}
                onChange={e => updateCustomer('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="form-submit-wrapper">
            <button className="form-submit-btn" onClick={handleSubmit}>
              Generate Proposal
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
