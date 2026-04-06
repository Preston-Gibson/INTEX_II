export default function Footer() {
  return (
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
  )
}
