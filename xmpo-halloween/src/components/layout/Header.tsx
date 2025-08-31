import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/header.css";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      // Show header when at the top of the page
      if (currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide header when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Throttle scroll events for better performance
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(controlNavbar, 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [lastScrollY]);

  const scrollToFooter = () => {
    const footer = document.querySelector(".footer");
    footer?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`header ${isVisible ? "header-visible" : "header-hidden"}`}
    >
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
