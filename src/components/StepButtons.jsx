import { useEffect } from 'react'
import { useProposal } from '../context/ProposalContext'

const TOTAL_STEPS = 11

export default function StepButtons() {
  const { state, dispatch } = useProposal()
  const { currentStep } = state

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TOTAL_STEPS - 1

  function goBack() {
    if (currentStep > 0) {
      dispatch({ type: 'SET_STEP', payload: currentStep - 1 })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function goNext() {
    if (currentStep === 0) {
      // On data capture step, the form submit button handles advancement
      return
    }
    if (currentStep < TOTAL_STEPS - 1) {
      dispatch({ type: 'SET_STEP', payload: currentStep + 1 })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (e.key === 'ArrowLeft') goBack()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  // Hide bottom nav on data capture step
  if (currentStep === 0) return null

  return (
    <div className="step-buttons">
      <button
        className="step-btn step-btn-back"
        onClick={goBack}
        disabled={isFirstStep}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {!isLastStep && (
        <button className="step-btn step-btn-next" onClick={goNext}>
          Next
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
