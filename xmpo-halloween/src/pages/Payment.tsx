import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "../styles/payment.css";

interface CartItem {
  type: string;
  name: string;
  quantity: number;
  unitPrice: number;
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
    return "Standard";
  };

  // Helper function to group seats by zone
  const getSelectedSeatsByZone = (selectedSeats: string[]) => {
    const deluxeSeats = selectedSeats.filter(
      (seat) => getZoneType(seat) === "Deluxe"
    );
    const normalSeats = selectedSeats.filter(
      (seat) => getZoneType(seat) === "Standard"
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
        const seatPrices = { Deluxe: 40, Standard: 20 };
        const { deluxe: deluxeSeats, normal: normalSeats } =
          getSelectedSeatsByZone(data.selectedSeats);

        // Add deluxe tickets if any
        if (deluxeSeats.length > 0) {
          items.push({
            type: "deluxe",
            name: "Deluxe Ticket",
            quantity: deluxeSeats.length,
            unitPrice: seatPrices.Deluxe,
            price: deluxeSeats.length * seatPrices.Deluxe,
          });
        }

        // Add normal tickets if any
        if (normalSeats.length > 0) {
          items.push({
            type: "normal",
            name: "Standard Ticket",
            quantity: normalSeats.length,
            unitPrice: seatPrices.Standard,
            price: normalSeats.length * seatPrices.Standard,
          });
        }
      }

      setCartItems(items);
      setTotal(data.totalPrice || 0);
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    navigate("/seat-selection");
    setTimeout(scrollToTop, 100);
  };

  const handleContinue = () => {
    if (!agreedToTerms) {
      alert("Please agree to the Terms and Conditions");
      return;
    }
    navigate("/confirmation");
    setTimeout(scrollToTop, 100);
  };

  return (
    <>
      <Header />
      <div className="payment-page">
        <div className="payment-container">
          <h4>Your Cart</h4>

          <div className="cart-receipt">
            <div className="receipt-header">
              <div className="header-item">Item</div>
              <div className="header-qty">Qty</div>
              <div className="header-unit-price">Unit Price</div>
              <div className="header-subtotal">Subtotal</div>
            </div>

            {cartItems.map((item, index) => (
              <div key={index} className={`receipt-item ${item.type}`}>
                <div className="item-info">
                  <img
                    src={
                      item.type === "normal"
                        ? "./images/normal-t.avif"
                        : "./images/deluxe-t.avif"
                    }
                    alt={`${item.name} Ticket`}
                    className="item-image"
                  />
                  <span className="item-name">{item.name}</span>
                </div>
                <div className="item-qty">{item.quantity}</div>
                <div className="item-unit-price">RM {item.unitPrice}</div>
                <div className="item-subtotal">RM {item.price}</div>
              </div>
            ))}

            <div className="receipt-divider"></div>

            <div className="receipt-total">
              <div className="total-label">Total Amount:</div>
              <div className="total-amount">RM {total}</div>
            </div>
          </div>

          <div className="payment-method">
            <div className="bank-details">
              <h5>Bank Transfer Details</h5>
              <div className="bank-info">
                <p>
                  <strong>Bank:</strong> Maybank
                </p>
                <p>
                  <strong>Account Name:</strong>{" "}
                  <span className="highlight">
                    Philharmonic Orchestra Society of XMUM
                  </span>
                </p>
                <p>
                  <strong>Account Number:</strong> 562432548392
                </p>
              </div>
              <div className="bank-qr">
                <img
                  src="./images/bank-QR.jpg"
                  alt="Bank QR Code"
                  className="qr-image"
                />
              </div>
              <div className="payment-reminder">
                <p className="reminder-text">
                  <strong>
                    Remember to screenshot proof of payment for submission!
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <div className="terms-section">
            <h6>Terms and Conditions</h6>
            <div className="terms-content">
              <ol>
                <li>
                  Children aged <strong>4 years old and below</strong> are
                  strictly prohibited from entering.
                </li>
                <li>
                  All ticket sales are final. Tickets are non-refundable and
                  cannot be canceled once purchased.
                </li>
                <li>
                  Ensure the payment amount matches the total displayed after
                  seat selection. Any incorrect transfers will not be refunded.
                </li>
                <li>
                  Upon successful payment, a confirmation email will be sent to
                  the provided email address. Please ensure your contact details
                  are accurate.
                </li>
                <li>
                  Present your confirmation email at the ticket redemption booth
                  to collect your physical ticket.
                </li>
                <li>
                  The exact ticket redemption date will be announced on our
                  official Instagram page.
                </li>
                <li>A valid ticket is required for entry to the venue.</li>
                <li>No food or drinks are allowed except for plain water.</li>
                <li>
                  Attendees are required to behave respectfully and adhere to
                  all venue rules and regulations. We reserve the right to
                  refuse entry or remove anyone in violation of these policies,
                  without refund.
                </li>
                <li>
                  XMUM Philharmonic Orchestra reserves the right to amend the
                  Terms and Conditions at any time.
                </li>
                <li>
                  For inquiries, please contact Tee Zhi Yen (+60 1151110830) or
                  Khoo Li Ling (+60 172009299) via WhatsApp.
                </li>
              </ol>
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              I agree to the terms and conditions
            </label>
          </div>

          <div className="action-buttons">
            <button className="back-btn" onClick={handleBack}>
              Back
            </button>
            <button
              className="continue-btn"
              onClick={handleContinue}
              disabled={!agreedToTerms}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Payment;
