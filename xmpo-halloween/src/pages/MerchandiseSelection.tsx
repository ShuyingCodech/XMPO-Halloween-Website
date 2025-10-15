import React, { useEffect, useState } from "react";
import "../styles/merchandiseSelection.css";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import "../styles/common.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Product, PRODUCTS } from "../contants/Product";
import { computePriceForProduct, computeCartTotal } from "../utils/common";
import { checkMerchandiseAvailability } from "../services/firebaseService";

export type CartItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

const MerchandiseSelection: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>(
    sessionStorage.getItem("merchCart")
      ? JSON.parse(sessionStorage.getItem("merchCart")!)
      : []
  );
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [previewImage, setPreviewImage] = useState<string | undefined>(
    undefined
  );
  const navigate = useNavigate();
  const [checkingInventory, setCheckingInventory] = useState(false);

  /* Load cart from session storage on mount */
  useEffect(() => {
    const stored = sessionStorage.getItem("merchCart");
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch (err) {
        console.warn("Failed to parse merchCart from sessionStorage", err);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("merchCart", JSON.stringify(cart));
  }, [cart]);

  /* ---------- Cart helpers ---------- */
  const getCartQuantity = (productId: string, variantId?: string | null) => {
    // If variantId is passed, return the quantity for that product+variant,
    // otherwise return total for product across variants
    return cart
      .filter(
        (it) =>
          it.productId === productId &&
          (variantId === undefined ? true : it.variantId === variantId)
      )
      .reduce((sum, it) => sum + it.quantity, 0);
  };

  const addToCart = (
    productId: string,
    variantId: string | null,
    qty: number
  ) => {
    if (qty <= 0) return;
    setCart((prev) => {
      const foundIndex = prev.findIndex(
        (it) => it.productId === productId && it.variantId === variantId
      );

      if (foundIndex >= 0) {
        // update existing
        const copy = [...prev];
        copy[foundIndex] = {
          ...copy[foundIndex],
          quantity: copy[foundIndex].quantity + qty,
        };
        return copy;
      } else {
        // push new item
        return [...prev, { productId, variantId, quantity: qty }];
      }
    });
  };

  const updateCartItemQty = (
    productId: string,
    variantId: string | null,
    qty: number
  ) => {
    setCart((prev) => {
      const copy = prev
        .map((it) =>
          it.productId === productId && it.variantId === variantId
            ? { ...it, quantity: Math.max(0, qty) }
            : it
        )
        .filter((it) => it.quantity > 0);
      return copy;
    });
  };

  const removeCartItem = (productId: string, variantId: string | null) => {
    setCart((prev) =>
      prev.filter(
        (it) => !(it.productId === productId && it.variantId === variantId)
      )
    );
  };

  const cartTotal = () => {
  return computeCartTotal(cart, PRODUCTS);
};

  /* ---------- Modal handlers ---------- */
  const openProductModal = (product: Product) => {
    setActiveProduct(product);
    setModalQty(1);
    setActiveVariantId(
      product.variants && product.variants.length > 0
        ? product.variants[0].id
        : null
    );
    setPreviewImage(product.mainImage || product.additionalImages?.[0]);
    // open modal
    document.body.style.overflow = "hidden"; // prevent background scroll
  };

  const closeModal = () => {
    setActiveProduct(null);
    setActiveVariantId(null);
    setModalQty(1);
    setPreviewImage(undefined);
    document.body.style.overflow = "";
  };

  const handleAddFromModal = () => {
    if (!activeProduct) return;
    // If product has variants, ensure one selected
    if (
      activeProduct.variants &&
      activeProduct.variants.length > 0 &&
      !activeVariantId
    ) {
      notification.warning({
        message: "Please select an option",
        description: "Select a design/size before adding to cart.",
      });
      return;
    }
    addToCart(activeProduct.id, activeVariantId, modalQty);
    closeModal();
  };

  const handleThumbClick = (img: string) => {
    if (previewImage === img) {
      setPreviewImage(undefined);
    } else {
      setPreviewImage(img);
    }
  };

  const handleProceedToCheckout = async (nav: string) => {
    if (nav == "/seat-selection") {
      // Just navigate back to seat selection without checks
      navigate(nav);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setCheckingInventory(true);

    try {
      if (cart.length != 0) {
        // Check inventory availability
        const itemsToCheck = cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
        }));

        const { available, unavailableItems } =
          await checkMerchandiseAvailability(itemsToCheck);

        if (!available) {
          notification.error({
            message: "The following item(s) are out of stock",
            description: (
              <div>
                <ul>
                  {unavailableItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ),
            duration: 8,
          });
          return;
        }

        // If available, proceed to checkout
        sessionStorage.setItem("merchCart", JSON.stringify(cart));
      }
      navigate(nav);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error checking inventory:", error);
      notification.error({
        message: "Error",
        description: "Unable to verify stock availability. Please try again.",
        duration: 5,
      });
    } finally {
      setCheckingInventory(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
      <Header />
      <div className="merch-page">
        <div className="merch-container">
          <div className="merch-left">
            <h4>Merchandise</h4>
            <p className="merch-note">
              All merchandise can be collected at the merchandise counter on
              concert day.
            </p>

            <div className="merch-list">
              {PRODUCTS.map((p) => {
                const qtyTotal = getCartQuantity(p.id);
                return (
                  <div className="merch-item" key={p.id}>
                    <img
                      src={p.mainImage}
                      alt={p.name}
                      className="merch-thumb"
                    />
                    <div className="merch-info">
                      <div className="merch-row top">
                        <div className="merch-title">{p.name}</div>

                        {/* quantity display on right (x N) */}
                        <div className="merch-qty">x {qtyTotal}</div>
                      </div>

                      <div className="merch-row middle">
                        <div className="merch-prices">
                          {p.packs.map((pack) =>
                            pack.count === 1 ? (
                              <div key={pack.count} className="price-line">
                                RM{pack.price} / pc
                              </div>
                            ) : (
                              <div key={pack.count} className="price-line">
                                RM{pack.price} / {pack.count} pcs
                              </div>
                            )
                          )}
                        </div>

                        <button
                          className="open-modal-btn"
                          onClick={() => openProductModal(p)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="merch-right">
            <h5>Your Merchandise</h5>

            <div className="cart-summary">
              {cart.length === 0 ? (
                <div className="empty-cart">No merchandise selected.</div>
              ) : (
                <>
                  {cart.map((it) => {
                    const product = PRODUCTS.find(
                      (p) => p.id === it.productId
                    )!;
                    const variant = product.variants?.find(
                      (v) => v.id === it.variantId
                    );
                    return (
                      <div
                        className="merch-item"
                        key={`${it.productId}-${it.variantId || "none"}`}
                      >
                        <div className="cart-left">
                          <div className="cart-title">{product.name}</div>
                          {variant && (
                            <div className="cart-variant">{variant.name}</div>
                          )}
                          <div className="cart-sub">
                            {it.quantity} × RM
                            {computePriceForProduct(product, 1)}{" "}
                            {/* per-unit display is approximate when packs exist; we keep simple */}
                            <span className="cart-line-total">
                              RM{computePriceForProduct(product, it.quantity)}
                            </span>
                          </div>
                        </div>
                        <div className="cart-right">
                          <div className="qty-controls">
                            <button
                              onClick={() =>
                                updateCartItemQty(
                                  it.productId,
                                  it.variantId ?? null,
                                  it.quantity - 1
                                )
                              }
                            >
                              −
                            </button>
                            <div className="qty-num">{it.quantity}</div>
                            <button
                              onClick={() =>
                                updateCartItemQty(
                                  it.productId,
                                  it.variantId ?? null,
                                  it.quantity + 1
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              <div className="total-price">
                <h6>Total: RM {cartTotal()}</h6>
              </div>

              <button
                className="checkout-btn"
                // disabled={cart.length === 0 || checkingInventory}
                onClick={() => handleProceedToCheckout("/payment")}
              >
                Continue to Payment
              </button>
              <button
                className="clear-cart-btn"
                onClick={() => handleProceedToCheckout("/seat-selection")}
              >
                Back to Ticket Selection
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* ---------- Modal ---------- */}
      {activeProduct && (
        <div className="merch-modal-overlay" onClick={closeModal}>
          <div className="merch-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>

            <div className="modal-left">
              <img
                src={previewImage || activeProduct.mainImage}
                alt={activeProduct.name}
                className="modal-main-img"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (previewImage || activeProduct.mainImage) {
                    window.open(
                      previewImage || activeProduct.mainImage,
                      "_blank"
                    );
                  }
                }}
              />
              <div className="modal-thumbs">
                {activeProduct.additionalImages?.map((img) => (
                  <img
                    className={`modal-thumb ${
                      previewImage === img ? "active" : ""
                    }`}
                    key={img}
                    src={img}
                    onClick={() => handleThumbClick(img)}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </div>
            </div>

            <div className="modal-right">
              <h5>{activeProduct.name}</h5>
              <div className="modal-desc">
                {activeProduct.description
                  .split("\n") // break into lines
                  .filter((line) => line.trim() !== "") // skip empty lines
                  .map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
              </div>

              {activeProduct.variants && (
                <div className="variant-section">
                  <label className="variant-label">Select design / size:</label>
                  <div className="variant-list">
                    {activeProduct.variants.map((v) => (
                      <button
                        key={v.id}
                        className={`variant-btn ${
                          activeVariantId === v.id ? "active" : ""
                        }`}
                        onClick={() => setActiveVariantId(v.id)}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="qty-row">
                <label className="quantity-label">Quantity</label>
                <div className="qty-controls modal-qty">
                  <button
                    onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                  >
                    −
                  </button>
                  <div className="qty-num">{modalQty}</div>
                  <button onClick={() => setModalQty(modalQty + 1)}>+</button>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="add-cart-confirm"
                  onClick={handleAddFromModal}
                >
                  Add to Cart
                </button>
                <button className="modal-cancel" onClick={closeModal}>
                  Cancel
                </button>
              </div>

              {/* {activeProduct.notes && (
                <div className="modal-notes">{activeProduct.notes}</div>
              )} */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MerchandiseSelection;
