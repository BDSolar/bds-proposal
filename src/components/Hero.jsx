import DiamondLogo from './DiamondLogo'

export default function Hero({ badge, title, highlightText, subtitle, children }) {
  return (
    <section className="hero">
      <DiamondLogo size={80} className="hero-logo" />
      {badge && <div className="hero-label">{badge}</div>}
      <h1>
        {title}
        {highlightText && (
          <>
            <br />
            <span className="highlight">{highlightText}</span>
          </>
        )}
      </h1>
      {subtitle && <p className="hero-sub">{subtitle}</p>}
      {children}
      <div className="scroll-cue">
        <span>Scroll</span>
        <div className="arrow"></div>
      </div>
    </section>
  )
}
