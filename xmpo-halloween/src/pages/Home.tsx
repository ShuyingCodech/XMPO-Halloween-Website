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
