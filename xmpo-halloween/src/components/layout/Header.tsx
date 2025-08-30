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
        <div
          className="logo-section"
          onClick={() =>
            (window.location.href =
              "https://xmposite.wixsite.com/xmumphilharmonic")
          }
        >
          <img
            src="./images/xmpo-logo.avif"
            alt="XMPO Logo"
            style={{ width: "253px", height: "101px", marginRight: "10px" }}
          />
        </div>

        <div className="nav-buttons">
          <button
            className="nav-btn"
            onClick={() =>
              (window.location.href =
                "https://xmposite.wixsite.com/xmumphilharmonic/about")
            }
          >
            About XMPO
          </button>
          <button
            className="nav-btn"
            onClick={() =>
              (window.location.href =
                "https://xmposite.wixsite.com/xmumphilharmonic/tickets")
            }
          >
            Buy Tickets
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
