import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "../styles/payment.css";
import { notification } from "antd";
import { computePriceForProduct, computeCartTotal } from "../utils/common";
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

  // Function to get merchandise cart items
  const getMerchandiseItems = (): { items: CartItem[]; total: number } => {
    const merchCartStr = sessionStorage.getItem("merchCart");
    if (!merchCartStr) return { items: [], total: 0 };

    try {
      const merchCart: MerchCartItem[] = JSON.parse(merchCartStr);

      // Calculate the actual total using cross-variant pricing
      const actualTotal = computeCartTotal(merchCart, PRODUCTS);

      // Group items by product for display
      const productGroups: Record<string, MerchCartItem[]> = {};
      merchCart.forEach((item) => {
        if (!productGroups[item.productId]) {
          productGroups[item.productId] = [];
        }
        productGroups[item.productId].push(item);
      });

      const merchItems: CartItem[] = [];

      // For each product group, create display items
      Object.entries(productGroups).forEach(([productId, items]) => {
        const product = PRODUCTS.find((p) => p.id === productId);
        if (!product) return;

        

        

        // If product has variants, we need to show each variant separately
        // but the pricing will be calculated together
        if (product.variants && product.variants.length > 0) {
          const totalQtyForProduct = items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          const totalPriceForProduct = computePriceForProduct(
            product,
            totalQtyForProduct
          );
          const avgUnitPrice = totalPriceForProduct / totalQtyForProduct;

          items.forEach((item) => {
            const variant = product.variants?.find(
              (v) => v.id === item.variantId
            );
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
        } else {
          // No variants, calculate normally
          items.forEach((item) => {
            const itemPrice = computePriceForProduct(product, item.quantity);
            const unitPrice = computePriceForProduct(product, 1);
            merchItems.push({
              type: "merchandise",
              name: product.name,
              quantity: item.quantity,
              unitPrice: unitPrice,
              price: itemPrice,
            });
          });
        }
      });

      return { items: merchItems, total: actualTotal };
    } catch (err) {
      console.warn("Failed to parse merchCart", err);
      return { items: [], total: 0 };
    }
  };

  useEffect(() => {
    const ticketData = sessionStorage.getItem("ticketData");
    const items: CartItem[] = [];
    let newTotal = 0;

    // Load ticket items from sessionStorage
    if (ticketData) {
      try {
        const data = JSON.parse(ticketData);

        if (data.ticketItems && Array.isArray(data.ticketItems)) {
          items.push(...data.ticketItems);
          data.ticketItems.forEach((item: CartItem) => {
            newTotal += item.price;
          });
        }
      } catch (err) {
        console.error("Failed to parse ticketData", err);
      }
    }

    // Add merchandise items with correct total
    const { items: merchItems, total: merchTotal } = getMerchandiseItems();
    if (merchItems.length > 0) {
      items.push(...merchItems);
      newTotal += merchTotal; // Use the actual calculated total
    }

    setCartItems(items);
    setTotal(newTotal);
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
    return item.type === "deluxe"
      ? "./images/deluxe-t.avif"
      : "./images/normal-t.avif";
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
