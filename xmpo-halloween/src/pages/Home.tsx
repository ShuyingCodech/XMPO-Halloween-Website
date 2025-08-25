import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="home-page">
        <div className="home-container">
          <div className="hero-section">
            <h1>XMUM Philharmonic Orchestra</h1>
            <p>Experience the magic of classical music</p>

            <div className="ticket-info">
              <h2>Concert Details</h2>
              <div className="details-grid">
                <div className="detail-item">
                  <strong>Date:</strong> [Concert Date]
                </div>
                <div className="detail-item">
                  <strong>Time:</strong> [Concert Time]
                </div>
                <div className="detail-item">
                  <strong>Venue:</strong> [Venue Name]
                </div>
              </div>

              <div className="pricing-info">
                <h3>Ticket Prices</h3>
                <div className="price-list">
                  <div className="price-item">Zone A: RM 35-40</div>
                  <div className="price-item">Zone B: RM 25-30</div>
                  <div className="price-item">Zone C: RM 20-25</div>
                </div>
                <p className="price-note">
                  *Lower prices available during early bird period
                </p>
              </div>
            </div>

            <button
              className="buy-tickets-btn"
              onClick={() => navigate("/seat-selection")}
            >
              Buy Tickets
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
