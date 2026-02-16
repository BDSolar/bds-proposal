import { useEffect, useRef } from 'react'
import '../styles/sticky-beat.css'

export default function StickyBeatChart({ chart, beats, activeBeat, onBeatChange }) {
  const beatRefs = useRef([])

  useEffect(() => {
    const observers = beatRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            onBeatChange(i)
          }
        },
        { threshold: 0.5 }
      )
      obs.observe(el)
      return obs
    })

    return () => observers.forEach(obs => obs?.disconnect())
  }, [onBeatChange, beats.length])

  return (
    <section className="story-wrapper">
      <div className="sticky-chart">
        {chart}
      </div>

      <div className="beat-track">
        {beats.map((beat, i) => (
          <div
            key={beat.id}
            className="beat-spacer"
            ref={el => (beatRefs.current[i] = el)}
          >
            <div className={`beat-card${activeBeat === i ? ' active' : ''}`}>
              {beat.time && <div className={`beat-time ${beat.timeClass || ''}`}>{beat.time}</div>}
              <div className="beat-title">{beat.title}</div>
              <div className="beat-text">{beat.content}</div>
            </div>
          </div>
        ))}
        <div style={{ height: '30vh' }} />
      </div>
    </section>
  )
}
