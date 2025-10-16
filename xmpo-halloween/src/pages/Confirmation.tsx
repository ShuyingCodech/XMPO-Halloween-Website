import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import "../styles/confirmation.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button, notification, Upload, Spin } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import {
  BookingData,
  checkSeatsAvailability,
  createBooking,
} from "../services/firebaseService";
import { computePriceForProduct, computeCartTotal } from "../utils/common";
import { PRODUCTS } from "../contants/Product";

interface TicketItem {
  type: string;
  name: string;
  quantity: number;
  unitPrice: number;
  price: number;
}

interface TicketData {
  selectedSeats: string[];
  totalPrice: number;
  selectedPackages: string[];
  ticketItems: TicketItem[];
  isEarlyBird: boolean;
}

interface MerchCartItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

interface MerchDisplayItem {
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Initialize EmailJS (do this once in your app)
emailjs.init("DytKDFiXjf6QbWru_"); // Get this from EmailJS dashboard

// Email service function using EmailJS
// Updated Email service function using EmailJS
const sendBookingConfirmationEmail = async (bookingData: any) => {
  try {
    // Get zone information from ticket items
    const hasDeluxe = bookingData.ticketItems?.some(
      (item: TicketItem) => item.type === "deluxe"
    );
    const hasStandard = bookingData.ticketItems?.some(
      (item: TicketItem) => item.type === "normal"
    );

    let zones = [];
    if (hasDeluxe) zones.push("Deluxe");
    if (hasStandard) zones.push("Standard");
    const zoneText = zones.join(", ");

    // Format merchandise info for email
    let merchInfo = "-";
    if (bookingData.merchandise && bookingData.merchandise.length > 0) {
      merchInfo = bookingData.merchandise
        .map((item: MerchDisplayItem, index: number) => {
          const variantText = item.variant ? ` (${item.variant})` : "";
          return `${index + 1}. ${item.name}${variantText} x ${
            item.quantity
          } - RM${item.totalPrice}`;
        })
        .join("\n");
    }

    // Format ticket info for email
    let ticketInfo = "-";
    if (bookingData.selectedSeats && bookingData.selectedSeats.length > 0) {
      ticketInfo = `<span style="color:#ff8a00;"><strong>Zone:</strong></span> ${zoneText}<br><span style="color:#ff8a00;"><strong>Seats Selected:</strong></span> ${bookingData.selectedSeats.join(
        ", "
      )}`;
    }

    // Prepare template parameters
    const templateParams = {
      to_name: bookingData.name,
      to_email: bookingData.email,
      customer_name: bookingData.name,
      booking_id: bookingData.bookingId || "N/A",

      // Purchase Details
      zone: zoneText,
      selected_seats: bookingData.selectedSeats.join(", "),
      ticket_info: ticketInfo,
      merchandise: merchInfo,
      total_price: bookingData.totalPrice,

      // Collection Details
      collection_dates: `27/10, Mon - 7pm - 10pm - Spookydadoo Booth, B1 1st floor near B1-101 Multipurpose Hall
28/10, Tue - 6pm - 8pm - B1 Ground Floor, in front of Astana
29/10, Wed - 6pm - 8pm - B1 Ground Floor, in front of Astana
30/10, Thu - 6pm - 8pm - B1 Ground Floor, in front of Astana
Concert Day 1/11, Sat - 6pm - 6.50pm - Tan Hua Choon Auditorium Lobby`,

      // Concert details
      concert_title:
        '"Nightmare on Symphony Street" - A Chamber Orchestra Concert',
      concert_date: "1st Nov 2025 (Saturday)",
      concert_times: `6.00pm, Hall Open
7.00pm, Concert Starts`,
      venue: "Tan Hua Choon Auditorium, Xiamen University Malaysia",

      // Contact information
      contact_1: "TEE ZHI YEN: 011-51110830 (OC)",
      contact_2: "KHOO LI LING: 017-2009299 (VOC)",
      contact_3: "BEY HUI YIEN: 011-11937687 (VOC)",
      contact_4: "ON ZHE QIE: 019-2210298 (Ticketing)",
      contact_5: "LAI YAN WEN: 010-4629023 (Ticketing)",
    };

    const result = await emailjs.send(
      "service_eze2a64", // Your EmailJS service ID
      "template_msy2i8d", // Your EmailJS template ID
      templateParams
    );

    console.log("Email sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const Confirmation: React.FC = () => {
  const navigate = useNavigate();
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [merchItems, setMerchItems] = useState<MerchDisplayItem[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    email: "",
    contactNo: "",
    paymentReceipt: null as File | null,
  });

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

  // Function to load merchandise items from session storage
  const loadMerchandiseItems = (): MerchDisplayItem[] => {
    const merchCartStr = sessionStorage.getItem("merchCart");
    if (!merchCartStr) return [];

    try {
      const merchCart: MerchCartItem[] = JSON.parse(merchCartStr);
      const items: MerchDisplayItem[] = [];

      merchCart.forEach((item) => {
        const product = PRODUCTS.find((p) => p.id === item.productId);
        if (!product) return;

        const variant = product.variants?.find((v) => v.id === item.variantId);
        const totalPrice = computePriceForProduct(product, item.quantity);
        const unitPrice = computePriceForProduct(product, 1);

        items.push({
          name: product.name,
          variant: variant?.name,
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        });
      });

      return items;
    } catch (err) {
      console.warn("Failed to parse merchCart", err);
      return [];
    }
  };

  // Function to calculate merchandise total
  const calculateMerchTotal = (items: MerchDisplayItem[]): number => {
    // Use the actual cross-variant pricing from session storage
    const merchCartStr = sessionStorage.getItem("merchCart");
    if (!merchCartStr) return 0;

    try {
      const merchCart: MerchCartItem[] = JSON.parse(merchCartStr);
      return computeCartTotal(merchCart, PRODUCTS);
    } catch (err) {
      console.warn("Failed to calculate merch total", err);
      // Fallback to summing display items
      return items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
  };

  useEffect(() => {
    // Load merchandise items
    const loadedMerchItems = loadMerchandiseItems();
    setMerchItems(loadedMerchItems);
    const merchTotal = calculateMerchTotal(loadedMerchItems);

    // Load ticket data from session storage
    const storedTicketData = sessionStorage.getItem("ticketData");

    // Check if we have either tickets or merchandise
    if (!storedTicketData && loadedMerchItems.length === 0) {
      notification.error({
        message: "No Booking Data",
        description: "Please select seats or merchandise before proceeding.",
        duration: 3,
      });
      navigate("/seat-selection");
      setTimeout(scrollToTop, 100);
      return;
    }

    if (storedTicketData) {
      try {
        const data = JSON.parse(storedTicketData);

        // Use the stored ticket items and total price
        // Add merchandise total to ticket total
        const totalPrice = (data.totalPrice || 0) + merchTotal;

        setTicketData({
          selectedSeats: data.selectedSeats || [],
          totalPrice: totalPrice,
          selectedPackages: data.selectedPackages || [],
          ticketItems: data.ticketItems || [],
          isEarlyBird: data.isEarlyBird || false,
        });
      } catch (error) {
        notification.error({
          message: "Invalid Booking Data",
          description: "Please start your booking process again.",
          duration: 3,
        });
        navigate("/seat-selection");
        setTimeout(scrollToTop, 100);
      }
    } else {
      // Only merchandise, no tickets
      setTicketData({
        selectedSeats: [],
        totalPrice: merchTotal,
        selectedPackages: [],
        ticketItems: [],
        isEarlyBird: false,
      });
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (info: any) => {
    if (info.fileList.length > 0) {
      const file = info.fileList[0].originFileObj;
      setImageUpload(file);
      setFormData((prev) => ({
        ...prev,
        paymentReceipt: file,
      }));
    } else {
      setImageUpload(null);
      setFormData((prev) => ({
        ...prev,
        paymentReceipt: null,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      notification.error({
        message: "Validation Error",
        description: "Please enter your name.",
        duration: 3,
      });
      return false;
    }

    if (!formData.email.trim()) {
      notification.error({
        message: "Validation Error",
        description: "Please enter your email address.",
        duration: 3,
      });
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      notification.error({
        message: "Validation Error",
        description: "Please enter a valid email address.",
        duration: 3,
      });
      return false;
    }

    if (!formData.contactNo.trim()) {
      notification.error({
        message: "Validation Error",
        description: "Please enter your contact number.",
        duration: 3,
      });
      return false;
    }

    if (!formData.paymentReceipt) {
      notification.error({
        message: "Validation Error",
        description: "Please upload your payment receipt.",
        duration: 3,
      });
      return false;
    }

    return true;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    navigate("/payment");
    setTimeout(scrollToTop, 100);
  };

  const handleConfirm = async () => {
    if (!validateForm() || !ticketData) {
      return;
    }

    setLoading(true);

    try {
      // Double-check seat availability before confirming (only if seats were selected)
      if (ticketData.selectedSeats.length > 0) {
        const isAvailable = await checkSeatsAvailability(
          ticketData.selectedSeats
        );
        if (!isAvailable) {
          notification.error({
            message: "Seats No Longer Available",
            description:
              "One or more of your selected seats have been taken. Please select different seats.",
            duration: 5,
          });
          navigate("/seat-selection");
          setTimeout(scrollToTop, 100);
          return;
        }
      }

      // Get merchandise cart
      const merchCartStr = sessionStorage.getItem("merchCart");
      const merchCart: MerchCartItem[] = merchCartStr
        ? JSON.parse(merchCartStr)
        : [];

      // Convert merchandise cart to proper format
      const merchandiseData =
        merchCart.length > 0
          ? merchCart
              .map((item) => {
                const product = PRODUCTS.find((p) => p.id === item.productId);
                if (!product) return null;

                const variant = product.variants?.find(
                  (v) => v.id === item.variantId
                );
                const unitPrice = computePriceForProduct(product, 1);
                const totalPrice = computePriceForProduct(
                  product,
                  item.quantity
                );

                return {
                  productId: item.productId,
                  productName: product.name,
                  variantId: item.variantId || null,
                  variantName: variant?.name ?? null,
                  quantity: item.quantity,
                  unitPrice,
                  totalPrice,
                };
              })
              .filter((item): item is NonNullable<typeof item> => item !== null)
          : [];

      // Get seatTypes from selected seats
      const seatTypes = getSelectedSeatsByZone(ticketData.selectedSeats);

      // Prepare booking data
      const bookingData: BookingData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        contactNo: formData.contactNo.trim(),
        selectedSeats: ticketData.selectedSeats,
        seatTypes: seatTypes,
        totalPrice: ticketTotal,
        totalTicketMerchPrice: ticketData.totalPrice,
        totalMerchPrice: merchTotal,
        selectedPackages: ticketData.selectedPackages,
      };

      // Only add optional fields if they have values
      if (formData.studentId.trim()) {
        bookingData.studentId = formData.studentId.trim();
      }

      if (merchandiseData.length > 0) {
        bookingData.merchandise = merchandiseData;
      }

      // Create booking with payment receipt
      const result = await createBooking(
        bookingData,
        formData.paymentReceipt ?? undefined
      );

      // Prepare email data with booking ID and merchandise from result
      const emailData = {
        ...bookingData,
        bookingId: result?.bookingId || null,
        merchandise: merchItems,
        ticketItems: ticketData.ticketItems,
      };

      // Send confirmation email using EmailJS
      try {
        await sendBookingConfirmationEmail(emailData);

        notification.success({
          message: "Booking Confirmed!",
          duration: 8,
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);

        notification.warning({
          message: "Booking Confirmed",
          description:
            "Your booking was successful, but we couldn't send a confirmation email. Please save your booking details.",
          duration: 8,
        });
      }

      // Clear session storage
      sessionStorage.removeItem("ticketData");
      sessionStorage.removeItem("merchCart");

      // Navigate to success page
      navigate("/success");
      setTimeout(scrollToTop, 100);
    } catch (error) {
      console.error("Error creating booking:", error);

      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("no longer available")) {
          errorMessage =
            "One or more selected seats are no longer available. Please select different seats.";
          navigate("/seat-selection");
          setTimeout(scrollToTop, 100);
        } else if (error.message.includes("upload")) {
          errorMessage = "Failed to upload payment receipt. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }

      notification.error({
        message: "Booking Failed",
        description: errorMessage,
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while ticket data is being loaded
  if (!ticketData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Calculate ticket total from ticket items
  const ticketTotal = ticketData.ticketItems.reduce(
    (sum, item) => sum + item.price,
    0
  );
  const merchTotal = calculateMerchTotal(merchItems);

  return (
    <>
      <Header />
      <div className="confirmation-page">
        <div className="confirmation-container">
          <h4>Confirm Your Booking</h4>

          {/* Enhanced Booking Summary */}
          <div className="booking-summary">
            <h6>Booking Summary</h6>

            {/* Tickets Section */}
            {ticketData.selectedSeats.length > 0 && (
              <>
                <div className="summary-section">
                  <div className="summary-item">
                    <span>Selected Seats</span>
                    <span>{ticketData.selectedSeats.join(", ")}</span>
                  </div>
                </div>

                <div className="summary-section">
                  {ticketData.ticketItems.map((item, index) => (
                    <div className="summary-items" key={index}>
                      <span>{item.name}</span>
                      <span>
                        {item.quantity} × RM {item.unitPrice}
                      </span>
                      <span className="item-total">RM {item.price}</span>
                    </div>
                  ))}
                </div>

                {ticketData.selectedPackages?.length > 0 && (
                  <div className="summary-section">
                    <div className="summary-items">
                      <span>Packages:</span>
                      <span>{ticketData.selectedPackages.join(", ")}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Merchandise Section */}
            {merchItems.length > 0 && (
              <>
                <div className="summary-section">
                  <h6 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
                    Merchandise
                  </h6>
                  {merchItems.map((item, index) => (
                    <div className="summary-items" key={index}>
                      <span>
                        {item.name}
                        {item.variant && ` (${item.variant})`}
                      </span>
                      <span>
                        {item.quantity} × RM {item.unitPrice}
                      </span>
                      <span className="item-total">RM {item.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="summary-divider"></div>

            {/* Subtotals */}
            {ticketData.selectedSeats.length > 0 && merchItems.length > 0 && (
              <>
                <div className="summary-items">
                  <span>Tickets Subtotal:</span>
                  <span>RM {ticketTotal}</span>
                </div>
                <div className="summary-items">
                  <span>Merchandise Subtotal:</span>
                  <span>RM {merchTotal}</span>
                </div>
                <div className="summary-divider"></div>
              </>
            )}

            <div className="summary-items total">
              <span>
                <strong>Total Amount:</strong>
              </span>
              <span>
                <strong>RM {ticketData.totalPrice}</strong>
              </span>
            </div>
          </div>

          <form className="confirmation-form">
            <div className="form-group">
              <label htmlFor="name">Name (as per NRIC) *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="studentId">Student ID</label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                placeholder="* only for XMUM students"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactNo">Contact No *</label>
              <input
                type="tel"
                id="contactNo"
                name="contactNo"
                placeholder=" * 012-3456789"
                value={formData.contactNo}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentReceipt">Upload Payment Receipt *</label>
              <div className="file-upload">
                <Upload
                  id="receipt"
                  beforeUpload={(file) => {
                    const validTypes = [
                      "image/png",
                      "image/jpg",
                      "image/jpeg",
                      "application/pdf",
                    ];
                    if (!validTypes.includes(file.type)) {
                      notification.error({
                        message: "Invalid file type",
                        description:
                          "Please upload a file of type PNG, JPG, JPEG, or PDF!",
                      });
                      return Upload.LIST_IGNORE;
                    }

                    const maxSize = 5 * 1024 * 1024; // 5MB
                    if (file.size > maxSize) {
                      notification.error({
                        message: "File too large",
                        description: "Please upload a file smaller than 5MB!",
                      });
                      return Upload.LIST_IGNORE;
                    }

                    return false;
                  }}
                  onRemove={() => {
                    setImageUpload(null);
                    setFormData((prev) => ({
                      ...prev,
                      paymentReceipt: null,
                    }));
                  }}
                  onChange={handleFileChange}
                  maxCount={1}
                  disabled={loading}
                  showUploadList={{
                    extra: ({ size = 0 }) => (
                      <span style={{ color: "#cccccc" }}>
                        ({(size / 1024 / 1024).toFixed(2)}MB)
                      </span>
                    ),
                    showRemoveIcon: true,
                    removeIcon: <DeleteOutlined style={{ color: "white" }} />,
                  }}
                >
                  <Button icon={<UploadOutlined />} disabled={loading}>
                    Upload Receipt
                  </Button>
                </Upload>
              </div>
            </div>

            <div className="action-buttons">
              <button
                type="button"
                className="back-btn"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? <Spin size="small" /> : "Confirm Booking"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Confirmation;
