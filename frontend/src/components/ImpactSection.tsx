export default function ImpactSection() {
  return (
    <section className="impact-section">
      <div className="container">
        <div className="impact-header">
          <h2>Our Impact</h2>
          <p>
            Through direct intervention and long-term care, we are rewriting the stories
            of those who have endured the unimaginable.
          </p>
        </div>

        <div className="impact-bento">
          {/* Holistic Recovery — spans 2 cols */}
          <div className="bento-card bento-holistic">
            <div>
              <span className="material-symbols-outlined bento-icon">health_and_safety</span>
              <h3>Holistic Recovery</h3>
              <p style={{ marginTop: '0.75rem' }}>
                Specialized trauma-informed therapy and medical care designed for the
                unique needs of survivors.
              </p>
            </div>
            <div className="bento-stat">
              <span className="bento-stat-num">450+</span>
              <span className="bento-stat-label">Lives Restored</span>
            </div>
          </div>

          {/* Legal Advocacy — primary blue */}
          <div className="bento-card bento-legal">
            <span className="material-symbols-outlined bento-icon" style={{ fontSize: '3rem' }}>gavel</span>
            <h3>Legal Advocacy</h3>
            <p>Ensuring justice through proactive legal support and systemic reform.</p>
          </div>

          {/* Education — amber */}
          <div className="bento-card bento-education">
            <span className="material-symbols-outlined bento-icon" style={{ fontSize: '3rem' }}>school</span>
            <h3>Education</h3>
            <p>Empowering survivors with skills for an independent, secure future.</p>
          </div>

          {/* Safe Haven Housing — full width */}
          <div className="bento-card bento-housing">
            <div className="bento-housing-text">
              <span className="material-symbols-outlined bento-icon">home_pin</span>
              <h3>Safe Haven Housing</h3>
              <p>
                Our residential facilities provide a secure, home-like environment away
                from the reach of exploiters, allowing for deep, uninterrupted healing.
              </p>
              <a href="#" className="bento-link">
                Learn about our facilities
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
              </a>
            </div>
            <img
              className="bento-housing-img"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfE69d4d8O2ZuXYj4kishQKYX7UoXk_1JPXpqO373kVEbsM4F5S3a2twa7LhszUIe6iDUVQdBCmKYDzVgJPtJicoS2sDZfB_oQXMRM5rylfkoRhThT4jhL1GxkSvjPRkpZb_RH6weGslqNGVBtqDjbgD6X6qGmKAikVOuOu_ydNk7kvy5ME8y7f1Co26hcwVSwP6Hs8qN9pSFEkZ2NjI1q-OKmUK9DlxksUg8QhdlbBEaQz9BR8nuD8CGmICP41sYgfnebbdQngw"
              alt="Safe haven interior"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
