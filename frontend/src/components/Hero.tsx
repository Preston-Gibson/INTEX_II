export default function Hero() {
  return (
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

        {/* Right — image + floating quote */}
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
  )
}
