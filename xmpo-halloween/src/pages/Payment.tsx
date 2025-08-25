import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "../styles/payment.css";

interface CartItem {
  type: string;
  name: string;
  quantity: number;
  price: number;
}

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const ticketData = sessionStorage.getItem("ticketData");
    if (ticketData) {
      const data = JSON.parse(ticketData);
      const items: CartItem[] = [];

      // Add ticket items
      if (data.ticketType === "deluxe" && data.selectedSeats.length > 0) {
        items.push({
          type: "deluxe",
          name: "Deluxe Ticket",
          quantity: data.selectedSeats.length,
          price: data.totalPrice,
        });
      }

      if (data.ticketType === "normal" && data.selectedSeats.length > 0) {
        items.push({
          type: "normal",
          name: "Normal Ticket",
          quantity: data.selectedSeats.length,
          price: data.totalPrice,
        });
      }

      // Add merchandise items (placeholder)
      items.push(
        { type: "keychain", name: "keychain", quantity: 0, price: 0 },
        { type: "keychain-set", name: "keychain set", quantity: 0, price: 0 },
        { type: "canvas-bag", name: "canvas bag", quantity: 0, price: 0 }
      );

      setCartItems(items);
      setTotal(data.totalPrice);
    }
  }, []);

  const handleContinue = () => {
    if (!agreedToTerms) {
      alert("Please agree to the Terms and Conditions");
      return;
    }
    navigate("/confirmation");
  };

  return (
    <>
      <Header />
      <div className="payment-page">
        <div className="payment-container">
          <h2>Your Cart</h2>

          <div className="cart-items">
            {cartItems.map((item, index) => (
              <div key={index} className={`cart-item ${item.type}`}>
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x {item.quantity}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="total-section">
            <h3>Total: RM {total}</h3>
          </div>

          <div className="payment-method">
            <div className="bank-qr">
              <p>Bank QR</p>
            </div>
          </div>

          <div className="terms-section">
            <h3>Terms and Conditions</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              I agree to the terms and conditions
            </label>
          </div>

          <button
            className="continue-btn"
            onClick={handleContinue}
            disabled={!agreedToTerms}
          >
            Continue
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Payment;
