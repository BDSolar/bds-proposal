import { useState, useEffect, useCallback, useRef } from 'react'
import { useProposal } from '../context/ProposalContext'
import '../styles/nav.css'

const STEP_LABELS = [
  'Getting Started',
  'About Us',
  'Your Proposal',
  'The Problem',
  'Your Energy Life',
  'Adding Solar',
  'Adding Battery',
  'Before & After',
  'The Financial Picture',
  'Your System',
  'Transparency',
]

const TOTAL_STEPS = STEP_LABELS.length

export default function StepNav() {
  const { state, dispatch } = useProposal()
  const { currentStep } = state
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isVisible = state.formSubmitted || currentStep > 0
  const isFirst = currentStep <= 1
  const isLast = currentStep >= TOTAL_STEPS - 1
  const pct = (currentStep / (TOTAL_STEPS - 1)) * 100
  const label = `Section ${String(currentStep).padStart(2, '0')} \u2014 ${STEP_LABELS[currentStep]}`

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: currentStep - 1 })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep, dispatch])

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      dispatch({ type: 'SET_STEP', payload: currentStep + 1 })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep, dispatch])

  function jumpTo(i) {
    dispatch({ type: 'SET_STEP', payload: i })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMenuOpen(false)
  }

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Keyboard navigation (arrow keys)
  useEffect(() => {
    function handleKeyDown(e) {
      if (currentStep === 0) return
      if (menuOpen && e.key === 'Escape') { setMenuOpen(false); return }
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goBack()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, goBack, goNext, menuOpen])

  return (
    <>
      <nav className={`pill-nav${isVisible ? ' visible' : ''}`} ref={menuRef}>
        <div className="pill-progress">
          <div className="pill-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <button
          className="pill-arrow"
          onClick={goBack}
          disabled={isFirst}
          aria-label="Previous step"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <button className="pill-label" onClick={() => setMenuOpen(!menuOpen)}>
          {label}
        </button>
        <button
          className={`pill-arrow${isLast ? ' hidden' : ''}`}
          onClick={goNext}
          disabled={isLast}
          aria-label="Next step"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3l5 5-5 5" />
          </svg>
        </button>

        {/* Section picker menu */}
        <div className={`pill-menu${menuOpen ? ' open' : ''}`}>
          {STEP_LABELS.map((name, i) => (
            <button
              key={i}
              className={`pill-menu-item${i === currentStep ? ' active' : ''}`}
              onClick={() => jumpTo(i)}
            >
              <span className="pill-menu-num">{String(i).padStart(2, '0')}</span>
              {name}
            </button>
          ))}
        </div>
      </nav>

      {/* Backdrop */}
      {menuOpen && <div className="pill-backdrop" onClick={() => setMenuOpen(false)} />}
    </>
  )
}
