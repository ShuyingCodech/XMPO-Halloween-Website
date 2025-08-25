import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/header.css";

const Header: React.FC = () => {
  const navigate = useNavigate();

  const scrollToFooter = () => {
    const footer = document.querySelector(".footer");
    footer?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <div className="logo" onClick={() => navigate("/")}>
            XMPO
          </div>
          <div className="back-to-main" onClick={() => navigate("/")}>
            back to main page
          </div>
        </div>

        <div className="nav-buttons">
          <button className="nav-btn" onClick={scrollToFooter}>
            About Us
          </button>
          <button className="nav-btn" onClick={scrollToFooter}>
            Contact Us
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
