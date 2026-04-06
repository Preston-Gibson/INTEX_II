export default function Nav() {
  return (
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
  )
}
