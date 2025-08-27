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

  // Helper function to get zone type from seat code
  const getZoneType = (seatCode: string) => {
    const row = parseInt(seatCode.split("-")[0]);
    if (row >= 5 && row <= 9) return "Deluxe";
    return "Normal";
  };

  // Helper function to group seats by zone
  const getSelectedSeatsByZone = (selectedSeats: string[]) => {
    const deluxeSeats = selectedSeats.filter(
      (seat) => getZoneType(seat) === "Deluxe"
    );
    const normalSeats = selectedSeats.filter(
      (seat) => getZoneType(seat) === "Normal"
    );

    return {
      deluxe: deluxeSeats,
      normal: normalSeats,
    };
  };

  useEffect(() => {
    const ticketData = sessionStorage.getItem("ticketData");
    if (ticketData) {
      const data = JSON.parse(ticketData);
      const items: CartItem[] = [];

      if (data.selectedSeats && data.selectedSeats.length > 0) {
        const seatPrices = { Deluxe: 40, Normal: 20 };
        const { deluxe: deluxeSeats, normal: normalSeats } =
          getSelectedSeatsByZone(data.selectedSeats);

        // Add deluxe tickets if any
        if (deluxeSeats.length > 0) {
          items.push({
            type: "deluxe",
            name: "Deluxe Ticket",
            quantity: deluxeSeats.length,
            price: deluxeSeats.length * seatPrices.Deluxe,
          });
        }

        // Add normal tickets if any
        if (normalSeats.length > 0) {
          items.push({
            type: "normal",
            name: "Normal Ticket",
            quantity: normalSeats.length,
            price: normalSeats.length * seatPrices.Normal,
          });
        }
      }

      // TODO later: Add merchandise items (placeholder)
      // items.push(
      //   { type: "keychain", name: "keychain", quantity: 0, price: 0 },
      //   { type: "keychain-set", name: "keychain set", quantity: 0, price: 0 },
      //   { type: "canvas-bag", name: "canvas bag", quantity: 0, price: 0 }
      // );

      setCartItems(items);
      setTotal(data.totalPrice || 0);
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
          <h4>Your Cart</h4>

          <div className="cart-items">
            {cartItems.map((item, index) => (
              <div key={index} className={`cart-item ${item.type}`}>
                <div className="item-details">
                  <span className="item-name">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="item-price">RM {item.price}</span>
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
            <h5>Terms and Conditions</h5>
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
