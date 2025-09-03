import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "../styles/success.css";

const Success: React.FC = () => {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToEvent = () => {
    // Clear session storage since order is complete
    sessionStorage.removeItem("ticketData");
    navigate("/"); // Assuming "/" is your event page route
    setTimeout(scrollToTop, 100);
  };

  useEffect(() => {
    // Scroll to top when component mounts
    scrollToTop();
  }, []);

  return (
    <>
      <Header />
      <div className="success-page">
        <div className="success-container">
          <h1 className="success-header">Your order was placed successfully</h1>

          <p className="success-message">
            A confirmation email will be sent to you shortly. Remember to save
            this email as you will need it to claim your ticket(s)!
          </p>

          <div className="success-actions">
            <button className="back-to-event-btn" onClick={handleBackToEvent}>
              Back to Event Page
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Success;
