import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "../styles/payment.css";
import { notification } from "antd";
import { checkEarlyBirdStatus, computePriceForProduct } from "../utils/common";
import { PRODUCTS } from "../contants/Product";

interface CartItem {
  type: string;
  name: string;
  quantity: number;
  unitPrice: number;
  price: number;
  variant?: string;
}

interface MerchCartItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isEarlyBird, setIsEarlyBird] = useState(true);

  const seatPrices = {
    Deluxe: { original: 45, earlyBird: 40 },
    Standard: { original: 25, earlyBird: 20 },
  };

  // Function to get current price based on early bird status
  const getCurrentPrice = (zoneType: string, earlyBirdStatus: boolean) => {
    if (zoneType === "Deluxe") {
      return earlyBirdStatus
        ? seatPrices.Deluxe.earlyBird
        : seatPrices.Deluxe.original;
    }
    return earlyBirdStatus
      ? seatPrices.Standard.earlyBird
      : seatPrices.Standard.original;
  };

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

  // Function to get merchandise cart items
  const getMerchandiseItems = (): CartItem[] => {
    const merchCartStr = sessionStorage.getItem("merchCart");
    if (!merchCartStr) return [];

    try {
      const merchCart: MerchCartItem[] = JSON.parse(merchCartStr);
      const merchItems: CartItem[] = [];

      merchCart.forEach((item) => {
        const product = PRODUCTS.find((p) => p.id === item.productId);
        if (!product) return;

        const variant = product.variants?.find((v) => v.id === item.variantId);
        const itemPrice = computePriceForProduct(product, item.quantity);
        const unitPrice = computePriceForProduct(product, 1);

        merchItems.push({
          type: "merchandise",
          name: product.name,
          quantity: item.quantity,
          unitPrice: unitPrice,
          price: itemPrice,
          variant: variant?.name,
        });
      });

      return merchItems;
    } catch (err) {
      console.warn("Failed to parse merchCart", err);
      return [];
    }
  };

  // Function to recalculate cart items and total based on current pricing
  const recalculateCartItems = (
    selectedSeats: string[],
    earlyBirdStatus: boolean
  ) => {
    const items: CartItem[] = [];
    let newTotal = 0;

    // Add ticket items
    if (selectedSeats && selectedSeats.length > 0) {
      const { deluxe: deluxeSeats, normal: normalSeats } =
        getSelectedSeatsByZone(selectedSeats);

      // Add deluxe tickets if any
      if (deluxeSeats.length > 0) {
        const deluxePrice = getCurrentPrice("Deluxe", earlyBirdStatus);
        const deluxeSubtotal = deluxeSeats.length * deluxePrice;
        items.push({
          type: "deluxe",
          name: "Deluxe Ticket",
          quantity: deluxeSeats.length,
          unitPrice: deluxePrice,
          price: deluxeSubtotal,
        });
        newTotal += deluxeSubtotal;
      }

      // Add normal tickets if any
      if (normalSeats.length > 0) {
        const standardPrice = getCurrentPrice("Standard", earlyBirdStatus);
        const standardSubtotal = normalSeats.length * standardPrice;
        items.push({
          type: "normal",
          name: "Standard Ticket",
          quantity: normalSeats.length,
          unitPrice: standardPrice,
          price: standardSubtotal,
        });
        newTotal += standardSubtotal;
      }
    }

    // Add merchandise items
    const merchItems = getMerchandiseItems();
    items.push(...merchItems);
    merchItems.forEach((item) => {
      newTotal += item.price;
    });

    return { items, newTotal };
  };

  // Update session storage with new pricing
  const updateSessionStorage = (
    selectedSeats: string[],
    selectedPackages: string[],
    newTotal: number
  ) => {
    const ticketData = {
      selectedSeats,
      totalPrice: newTotal,
      selectedPackages,
    };
    sessionStorage.setItem("ticketData", JSON.stringify(ticketData));
  };

  // Set up interval to check early bird status
  useEffect(() => {
    const updateEarlyBirdStatus = () => {
      const newEarlyBirdStatus = checkEarlyBirdStatus();
      if (newEarlyBirdStatus !== isEarlyBird) {
        setIsEarlyBird(newEarlyBirdStatus);

        // Get current ticket data
        const ticketData = sessionStorage.getItem("ticketData");
        if (ticketData) {
          const data = JSON.parse(ticketData);

          // Recalculate with new pricing
          const { items, newTotal } = recalculateCartItems(
            data.selectedSeats || [],
            newEarlyBirdStatus
          );

          setCartItems(items);
          setTotal(newTotal);

          // Update session storage
          updateSessionStorage(
            data.selectedSeats || [],
            data.selectedPackages || [],
            newTotal
          );
        }
      }
    };

    // Check immediately
    updateEarlyBirdStatus();

    // Check every minute
    const interval = setInterval(updateEarlyBirdStatus, 60000);

    return () => clearInterval(interval);
  }, [isEarlyBird]);

  useEffect(() => {
    const ticketData = sessionStorage.getItem("ticketData");
    if (ticketData) {
      const data = JSON.parse(ticketData);

      // Check current early bird status
      const currentEarlyBirdStatus = checkEarlyBirdStatus();
      setIsEarlyBird(currentEarlyBirdStatus);

      // Calculate cart items with current pricing
      const { items, newTotal } = recalculateCartItems(
        data.selectedSeats || [],
        currentEarlyBirdStatus
      );

      setCartItems(items);
      setTotal(newTotal);

      // Update session storage if price changed
      if (newTotal !== data.totalPrice) {
        updateSessionStorage(
          data.selectedSeats || [],
          data.selectedPackages || [],
          newTotal
        );
      }
    } else {
      // No ticket data, but might have merchandise
      const merchItems = getMerchandiseItems();
      if (merchItems.length > 0) {
        setCartItems(merchItems);
        const merchTotal = merchItems.reduce(
          (sum, item) => sum + item.price,
          0
        );
        setTotal(merchTotal);
      }
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    const merchCartStr = sessionStorage.getItem("merchCart");
    if (merchCartStr) {
      navigate("/merch-selection");
    } else {
      navigate("/seat-selection");
    }
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

  // Get image for cart item
  const getItemImage = (item: CartItem) => {
    if (item.type === "merchandise") {
      const product = PRODUCTS.find((p) => p.name === item.name);
      return product?.mainImage || "./images/placeholder.png";
    }
    return item.type === "normal"
      ? "./images/normal-t.avif"
      : "./images/deluxe-t.avif";
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
                    src={getItemImage(item)}
                    alt={`${item.name}`}
                    className="item-image"
                  />
                  <div className="item-text">
                    <span className="item-name">{item.name}</span>
                    {item.variant && (
                      <span className="item-variant">{item.variant}</span>
                    )}
                  </div>
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
