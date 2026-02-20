import '../styles/components/testimonial.css'

export default function TestimonialQuote({ quote, name, location, system }) {
  return (
    <div className="testimonial-quote">
      <div className="testimonial-quote-text">&ldquo;{quote}&rdquo;</div>
      <div className="testimonial-quote-attr">
        <strong>{name}</strong>, {location}{system && <span className="testimonial-quote-system"> | {system}</span>}
      </div>
    </div>
  )
}
