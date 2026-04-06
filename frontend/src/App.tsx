import './styles.css'

export default function App() {
  return (
    <>
      {/* ── Navigation ── */}
      <nav className="nav">
        <div className="nav-inner container">
          <div className="nav-logo">
            <img src="/logo.png" alt="Lucera Safehouses & Support" />
          </div>

          <div className="nav-links">
            <a href="#" className="active">Our Mission</a>
            <a href="#">Impact</a>
            <a href="#">Donate</a>
          </div>

          <div className="nav-actions">
            <button className="nav-login">Portal Login</button>
            <button className="btn-support">Support Us</button>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-bg">
            <img
              className="hero-bg-img"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPSAsRstaZ7KJ9G7tVw0POtLWKAFVFTSvfddrEfSYd2AodDL5nAoK75AAsqlBnOuhnsrUwnXB8vXGWyQ3cS-EuCCvb9PoXQQFpuWiTxeQMFzFTLdoNeXLuVlQcss7f3lH_btzuM1n3AVMJlXElaAn7Y-hrimXKWutLpWcSakN7atW2o-rbXkM_mr515PwMER2XxopZPTV6UbmPa7Y-3Qy_iAV9tyvmJEaL8lnXK0S87w3iys8mCGIneduFvu_7mi9US7azR7RkTg"
              alt=""
            />
            <div className="hero-bg-overlay" />
          </div>

          <div className="hero-inner container">
            {/* Left — text */}
            <div className="hero-left">
              <span className="hero-tag">
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>location_on</span>
                Santa Rosa de Copán, Honduras
              </span>

              <h1>
                A Radiant Shield for the <span>Vulnerable.</span>
              </h1>

              <p className="hero-lead">
                Lucera is a dedicated sanctuary providing recovery, advocacy, and a hopeful
                future for children surviving exploitation in Central America.
              </p>

              <div className="hero-buttons">
                <button className="btn-aurora">
                  Donate Now
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>volunteer_activism</span>
                </button>
                <button className="btn-surface">Our Story</button>
              </div>
            </div>

            {/* Right — image placeholder + floating quote */}
            <div className="hero-right">
              <div className="hero-img-wrap">
                <img
                  className="hero-img"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYSH4d4VqJ7YpBlJVHzWI8BZiEBpDmL6JMrqtyyVSgNpZehmlCe7GYC2-hwK-MFlQPhOao5p-rbg6mT49dI-6fuiH4mT9OiHoRsG3U2HlXG5djeoYmYq0msISJRD9RrhDjAa5R_391Szh_RgeiEhPvPnrORU8-1UrOXdk5AGkXpA1mKTvv3l6pcgvJoOkL4SlogHHCmDmGM3uqhVJqNw8OsUhY-KJBZxBkCgq7wyO4maytk5oqCMZp4OZshMyWRsmoNIsbH2LniA"
                  alt="Compassionate caregiver with child in sanctuary"
                />
                <div className="hero-quote">
                  <p>"Hope is the first step toward healing."</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Our Impact — Bento Grid ── */}
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

        {/* ── The Buffer Against Exploitation ── */}
        <section className="howwework-section">
          <div className="container howwework-inner">
            <div className="howwework-text">
              <div className="howwework-glow" />
              <h2>The Buffer Against Exploitation</h2>
              <p>
                We operate in the critical gap between vulnerability and assault. Our mission
                is to create a multi-layered defense that protects children before the worst
                can happen, and heals them if it already has.
              </p>

              <div className="howwework-bullets">
                <div className="bullet-item">
                  <div className="bullet-icon bullet-icon--teal">
                    <span className="material-symbols-outlined">radar</span>
                  </div>
                  <div>
                    <h4>Early Detection</h4>
                    <p>Community-based monitoring systems to identify at-risk children before exploitation occurs.</p>
                  </div>
                </div>

                <div className="bullet-item">
                  <div className="bullet-icon bullet-icon--blue">
                    <span className="material-symbols-outlined">shield</span>
                  </div>
                  <div>
                    <h4>Rapid Response</h4>
                    <p>Immediate legal and physical intervention protocols to remove survivors from harm's way.</p>
                  </div>
                </div>

                <div className="bullet-item">
                  <div className="bullet-icon bullet-icon--amber">
                    <span className="material-symbols-outlined">favorite</span>
                  </div>
                  <div>
                    <h4>Generational Healing</h4>
                    <p>Working with families to break cycles of vulnerability and poverty through sustainable support.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Staggered image grid */}
            <div className="howwework-images">
              <div className="img-col img-col--offset">
                <img
                  className="howwework-img img-tall"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDc-5Iw58mAex94y_ECAHQtA4n9hf0av1NHNuByU4bMoHAAT9oTpS22jhbYV4R04MzTsyjC5F_Q9vX3TDWxe8YC1jAO61pQhD_A1U1rV4w5Etiles8BzLN8GYbrYNQjyW-uXEZXDyGPuBRo4Cp18vM3mF-ytwFoI-0tk2i6K9mcERRu5_Df12LhMTrpIK7YgNoo2cPn-i8zMgjSRWAJZbtMj4jZXnYYTmi01esoBylFXyNOIfgywbDSZNM0z9RmmcS-0uWYVJghRg"
                  alt="Child walking toward a bright horizon"
                />
                <img
                  className="howwework-img img-square"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1q-u2Mc2oyrCMEjBOVkG3KGUwFcLeizR7Wh3FmsWxbiXHaVj6y9lxLV2YThZsifR-Gc0Sl47Fj3yanHlY_N3GdWCBrry9bmYZE2bML9kbsaqHLS5PTwWx-8zJgbhL9yOEqf0mZHb_lIP89ee2_Z3LR66_fYjtzMxHxCXyG6HU9KFOt7NSczq8LoD841BlovzwXe37o1h9DjCgMMa_mFteWnW8XXVLXiXWfEWIxDzWrUbdg9DXzM0silvbTyvWgcXDoxsrrpUVIHw"
                  alt="Hands joined in support"
                />
              </div>
              <div className="img-col">
                <img
                  className="howwework-img img-square"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfr45ik6Eaq1qzASF519xMQnsneeX6k04ynS3oQlKu28hjqEv6fcsPXVM27AEHwTMtPnNgRczQpcIxL7cOd7iZ8KdJs5GRrI5qjPWNHgrgFP_ez94dGNhG9xtaDvLioQvzt3BftmVj2LAiTnItFMsqAN5WECJ0n3zObjBNy2A24LQih7KH2YfL-sd9Tdp1sb8npBlKN1H9hYKI6rSE9W0Y02y6ggdBIs7HZY_2idNibV68OpagTKdns5TRc8xyeGvCXsPKL3qzMg"
                  alt="Colorful village community"
                />
                <img
                  className="howwework-img img-tall"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyS8-zhBehfSldtHFWdfUTMRkPhR0mJDqvom_LNVrTx5wtCXBWxWQ4JclaWhumyGTQZZCmfp93PZWY9FWdoFqD4oqXTVkTnyz8V5_VsOIGsypoVRn3Qb2jLiZfv4L_Jb20HqXKpmus_mFqWPjQkHBd1P-6HbgpNHtEmnDdSfFFHO5RVQZhO6dz7CdQS_f_anwJipnjYsyiVlB-gKraBYY2mBxutv_McRRns3yddrtgAv7fYXPbmZIPBIk6rUyRmQcEMnxFAnSj5VQ"
                  alt="Bright classroom scene"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <h2>Join the Movement of Light.</h2>
              <p>
                Whether as a monthly donor or a strategic partner, your contribution serves
                as a radiant guardian for those who need it most.
              </p>
              <div className="cta-buttons">
                <button className="btn-cta-amber">Become a Partner</button>
                <button className="btn-cta-white">One-Time Gift</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div>
              <div className="footer-logo">
                <img src="/logo.png" alt="Lucera" />
              </div>
              <p className="footer-copy">
                © {new Date().getFullYear()} Lucera. Dedicated to the children of Central
                America. Providing safety, education, and hope.
              </p>
            </div>

            <div className="footer-cols">
              <div className="footer-col">
                <span className="footer-col-title">Organization</span>
                <a href="#">Transparency Report</a>
                <a href="#">Careers</a>
              </div>
              <div className="footer-col">
                <span className="footer-col-title">Connect</span>
                <a href="#">Contact Us</a>
                <a href="#">Privacy Policy</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-tagline">
              Restoring Hope &bull; Defending Innocence &bull; Securing Futures
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
