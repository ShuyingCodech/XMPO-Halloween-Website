import React from "react";
import "../../styles/footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="address-section">
            <h3>Address</h3>
            <p>
              Xiamen University Malaysia
              <br />
              Jalan Sunsuria,
              <br />
              Bandar Sunsuria,
              <br />
              43900 Sepang,
              <br />
              Selangor
            </p>
          </div>
        </div>

        <div className="footer-section">
          <div className="contact-section">
            <h3>Email</h3>
            <p>philharmonicorchestraxmum@gmail.com</p>

            <div className="social-links">
              <span>[insta logo]</span>
              <span>[whatsapp logo]</span>
            </div>
            <p>@ xmumphilharmonic</p>
          </div>
        </div>

        <div className="footer-section">
          <div className="social-section">
            <h3>Social Media</h3>
            <div className="social-icons">
              <span className="social-icon">📷</span>
              <span className="social-icon">📺</span>
              <span className="social-icon">小红书</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>black</p>
        <p>freeze footer (@ each page)</p>
      </div>
    </footer>
  );
};

export default Footer;
