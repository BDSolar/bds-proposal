import { useProposal } from '../context/ProposalContext'
import '../styles/nav.css'

const STEP_LABELS = [
  'Data Capture',
  'About Us',
  'Your Proposal',
  'The Problem',
  'Energy Life',
  'Adding Solar',
  'Adding Battery',
  'Before & After',
  'Money Over Time',
  'Your System',
  'Assumptions',
]

export default function StepNav() {
  const { state, dispatch } = useProposal()
  const { currentStep } = state

  // Only show nav after form is submitted (step >= 1)
  const isVisible = state.formSubmitted || currentStep > 0

  return (
    <nav className={`step-nav${isVisible ? ' visible' : ''}`}>
      <div className="step-nav-inner">
        <div className="step-nav-logo">
          <svg viewBox="0 0 22 22" fill="none">
            <path d="M7 8 L11 4 L15 8 L11 18 Z" stroke="url(#nGrad)" strokeWidth="1.2" fill="none" />
            <path d="M7 8 L15 8" stroke="url(#nGrad)" strokeWidth="1" />
            <defs>
              <linearGradient id="nGrad" x1="0" y1="0" x2="22" y2="22">
                <stop offset="0%" stopColor="#e000f0" />
                <stop offset="100%" stopColor="#a020f0" />
              </linearGradient>
            </defs>
          </svg>
          Black Diamond Solar
        </div>

        <div className="step-dots">
          {STEP_LABELS.map((label, i) => (
            <div
              key={i}
              className={`step-dot${i === currentStep ? ' active' : ''}${i < currentStep ? ' completed' : ''}`}
              data-label={label}
              onClick={() => {
                if (i <= currentStep || state.formSubmitted) {
                  dispatch({ type: 'SET_STEP', payload: i })
                }
              }}
            />
          ))}
        </div>

        <div className="step-current-label">
          {STEP_LABELS[currentStep]}
        </div>
      </div>
    </nav>
  )
}
