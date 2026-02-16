import useAnimateOnScroll from '../hooks/useAnimateOnScroll'

export default function ScrollSection({ children, className = '', autoHeight = false }) {
  const [ref, isVisible] = useAnimateOnScroll(0.15)

  return (
    <section className={`scroll-section${autoHeight ? ' auto-height' : ''} ${className}`}>
      <div ref={ref} className={`section-inner${isVisible ? ' visible' : ''}`}>
        {children}
      </div>
    </section>
  )
}
