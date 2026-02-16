export default function DiamondLogo({ size = 80, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="40" cy="40" r="38" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Diamond */}
      <path d="M26 30 L40 18 L54 30 L40 62 Z" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" />
      <path d="M26 30 L54 30" stroke="url(#logoGrad)" strokeWidth="1.5" />
      <path d="M30 30 L40 62" stroke="url(#logoGrad)" strokeWidth="0.8" opacity="0.4" />
      <path d="M50 30 L40 62" stroke="url(#logoGrad)" strokeWidth="0.8" opacity="0.4" />
      <path d="M40 18 L40 30" stroke="url(#logoGrad)" strokeWidth="0.8" opacity="0.4" />
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="80" y2="80">
          <stop offset="0%" stopColor="#e000f0" />
          <stop offset="100%" stopColor="#a020f0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
