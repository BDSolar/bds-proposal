import Hero from '../components/Hero'
import ScrollSection from '../components/ScrollSection'
import '../styles/sections/s0.css'

export default function S0_AboutUs() {
  return (
    <div>
      <Hero
        badge="About Us"
        title="Experience You Can Trust,"
        highlightText="Service You Deserve."
        subtitle="16,000+ installs. 30+ years combined experience. Australia's first and only Zero Bill Guarantee."
      >
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-number">16,000+</div>
            <div className="stat-label">Systems Installed</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">$100M+</div>
            <div className="stat-label">Annual Revenue</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50,000+</div>
            <div className="stat-label">Homes Converted</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">30+</div>
            <div className="stat-label">Years Experience</div>
          </div>
        </div>
      </Hero>

      {/* Team */}
      <ScrollSection>
        <div className="section-label">The Team</div>
        <div className="founders-grid">
          <div className="founder-card">
            <div className="founder-photo">
              <img src="./dean.webp" alt="Dean Iossifides" />
            </div>
            <div className="founder-name">Dean Iossifides</div>
            <div className="founder-role">Founder &amp; CEO</div>
            <div className="founder-desc">
              10+ years leading renewable energy businesses. Founded Black Diamond Solar to redefine quality and service in the industry.
            </div>
            <div className="founder-stat">16,000+ customers advised</div>
          </div>
          <div className="founder-card">
            <div className="founder-photo">
              <img src="./tom.png" alt="Tom Cooper" />
            </div>
            <div className="founder-name">Tom Cooper</div>
            <div className="founder-role">Technical Director</div>
            <div className="founder-desc">
              Unmatched technical expertise. Every system designed and installed for peak efficiency, reliability, and long-term performance.
            </div>
            <div className="founder-stat">Since 2009 &middot; Tier 1 Engineer</div>
          </div>
        </div>
        <div className="founder-message">
          <div className="founder-message-quote">&ldquo;</div>
          <div className="founder-message-text">
            Product selection, third-party testing, and manufacturer bankability are everything in this industry. We stand behind every product we install 100%.
          </div>
          <div className="founder-message-attr">&mdash; Dean Iossifides, Founder</div>
        </div>
      </ScrollSection>

      {/* BDS vs Competitors */}
      <ScrollSection>
        <div className="section-label">Why Choose Us</div>
        <div className="certainty-block">
          <div className="certainty-headline">
            <span className="certainty-left">You don&rsquo;t just get solar.</span>
            <span className="certainty-right mag">You get certainty.</span>
          </div>
          <p className="certainty-body">
            When the world&rsquo;s top-rated panels pair with the world&rsquo;s leading battery brand, the best solar systems shouldn&rsquo;t come with crossed fingers.
          </p>
          <div className="certainty-warranty">
            <span className="certainty-number">30</span>
            <div className="certainty-warranty-text">
              <strong>Year Warranty</strong>
              Performance &middot; Workmanship &middot; Monitoring &mdash; all covered.
            </div>
          </div>
        </div>

        <div className="accred-grid">
          <div className="accred-card">
            <img src="./clean-energy-council.png" alt="Clean Energy Council" className="accred-logo" />
            <div className="accred-name">Clean Energy Council</div>
            <div className="accred-detail">CEC Accredited Installers</div>
          </div>
          <div className="accred-card">
            <img src="./master-electricians.png" alt="Master Electricians Australia" className="accred-logo" />
            <div className="accred-name">Master Electricians</div>
            <div className="accred-detail">Licensed Electrical Contractor</div>
          </div>
          <div className="accred-card">
            <img src="./berkley-insurance.png" alt="Berkley Insurance" className="accred-logo" />
            <div className="accred-name">$20M Public Liability</div>
            <div className="accred-detail">Berkley Insurance</div>
          </div>
          <div className="accred-card">
            <img src="./saa-accredited.png" alt="SAA Accredited Installer" className="accred-logo" />
            <div className="accred-name">SAA Accredited</div>
            <div className="accred-detail">Approved Installer</div>
          </div>
          <div className="accred-card">
            <img src="./new-energy-tech.png" alt="New Energy Tech Approved Seller" className="accred-logo" />
            <div className="accred-name">New Energy Tech</div>
            <div className="accred-detail">Approved Seller</div>
          </div>
          <div className="accred-card">
            <img src="./smart-energy.png" alt="Smart Energy" className="accred-logo" />
            <div className="accred-name">Smart Energy</div>
            <div className="accred-detail">GMS Member</div>
          </div>
        </div>
      </ScrollSection>

      {/* Zero Bill Guarantee */}
      <ScrollSection>
        <div className="guarantee-card">
          <div className="guarantee-icon">&#128737;</div>
          <div className="guarantee-title">The <span className="green">Zero Bill</span> Guarantee</div>
          <div className="guarantee-desc">
            $0 electricity bills for 10 years. Systems designed with 50% extra capacity. If you receive a bill, we pay it &mdash; no exceptions.
          </div>
          <div className="guarantee-tag">&#10003; Australia&rsquo;s First &amp; Only</div>
        </div>
      </ScrollSection>
    </div>
  )
}
