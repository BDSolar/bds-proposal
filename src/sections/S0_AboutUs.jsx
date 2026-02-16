import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import '../styles/sections/s0.css'

export default function S0_AboutUs() {
  return (
    <div>
      <Hero
        badge="About Us"
        title="Experience You Can Trust,"
        highlightText="Service You Deserve"
        subtitle="Black Diamond Solar delivers solar with integrity, honesty, and a relentless focus on the customer."
      />

      {/* Our Story */}
      <ScrollSection>
        <div className="section-label">Our Story</div>
        <div className="ethos-section">
          <div className="ethos-body">
            The solar industry has lost its way &mdash; too many companies are focused on volume, not value. Customers are treated like numbers. Installations are rushed. Promises aren&rsquo;t kept. Black Diamond Solar was created to do things differently.
          </div>
        </div>
      </ScrollSection>

      {/* Founders */}
      <ScrollSection>
        <div className="section-label">The Team</div>
        <div className="founders-grid">
          <div className="founder-card">
            <div className="founder-icon">&#9830;</div>
            <div className="founder-name">Dean Iossifides</div>
            <div className="founder-role">Founder</div>
            <div className="founder-desc">
              A nationally recognised solar consultant with almost two decades of real-world industry experience. Dean has personally advised and delivered solar solutions for some of Australia&rsquo;s most reputable solar companies, earning the trust of over 16,000 homeowners and businesses throughout Queensland.
            </div>
            <div className="founder-stat">16,000+ customers advised</div>
          </div>
          <div className="founder-card">
            <div className="founder-icon">&#9889;</div>
            <div className="founder-name">Tom</div>
            <div className="founder-role">Lead Installer &middot; Tier 1 Electrical Engineer</div>
            <div className="founder-desc">
              A highly respected specialist installer and Tier 1 electrical engineer in the field since 2009. Tom has designed, installed, and maintained thousands of complex solar systems, from residential rooftops to large-scale commercial operations. His obsession with quality ensures every install meets the highest technical standards.
            </div>
            <div className="founder-stat">Since 2009 &middot; Tier 1 Engineer</div>
          </div>
        </div>
      </ScrollSection>

      {/* Ethos */}
      <ScrollSection>
        <div className="ethos-section">
          <h2>We <em>don&rsquo;t</em> cut corners.<br />We <em>don&rsquo;t</em> overpromise.</h2>
          <div className="ethos-body">
            We tailor every solution based on your property, your power usage, and your long-term financial goals &mdash; using only premium components. Our zero-deposit, government-backed payment plans make going solar affordable and risk-free.
          </div>
          <div className="ethos-tagline">Customer First. Every Time.</div>
        </div>
      </ScrollSection>

      {/* Values + Certs */}
      <ScrollSection>
        <div className="section-label">What Sets Us Apart</div>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon purple">&#9670;</div>
            <div className="value-title">Premium Components Only</div>
            <div className="value-desc">German/Australian-engineered bifacial glass panels and world-leading hybrid inverters. No cheap substitutions, ever.</div>
          </div>
          <div className="value-card">
            <div className="value-icon green">&#10003;</div>
            <div className="value-title">30-Year Warranties</div>
            <div className="value-desc">Comprehensive coverage across performance, workmanship, monitoring, and waterproofing. We stand behind every install.</div>
          </div>
          <div className="value-card">
            <div className="value-icon gold">&#9733;</div>
            <div className="value-title">Tailored to You</div>
            <div className="value-desc">No cookie-cutter systems. Every solution is designed around your property, usage, and financial goals.</div>
          </div>
        </div>
        <div className="certs-row">
          <div className="cert-badge"><div className="cert-name">Sungrow</div><div className="cert-label">Authorised Partner</div></div>
          <div className="cert-badge"><div className="cert-name">Tesla Energy</div><div className="cert-label">Certified Installer</div></div>
          <div className="cert-badge"><div className="cert-name">SigEnergy</div><div className="cert-label">Authorised Dealer</div></div>
          <div className="cert-badge"><div className="cert-name">LONGi Solar</div><div className="cert-label">Premium Partner</div></div>
        </div>
      </ScrollSection>

      {/* Guarantee */}
      <ScrollSection>
        <div className="guarantee-card">
          <div className="guarantee-icon">&#128737;</div>
          <div className="guarantee-title">The <span className="green">Zero Bill Energy</span> Program</div>
          <div className="guarantee-desc">
            Pay nothing for your energy for 10 years &mdash; guaranteed. We engineer your system to 150% of your usage. If it doesn&rsquo;t zero your bill, we pay the difference.
          </div>
          <div className="guarantee-tag">&#10003; Bill-to-Zero Guarantee</div>
        </div>
      </ScrollSection>
    </div>
  )
}
