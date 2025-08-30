// Fixed Confirmation.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

interface TicketData {
  selectedSeats: string[];
  totalPrice: number;
  selectedPackages: string[];
  seatTypes: {
    deluxe: string[];
    normal: string[];
  };
}

const Confirmation: React.FC = () => {
  const navigate = useNavigate();
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
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

  useEffect(() => {
    // Load ticket data from session storage
    const storedTicketData = sessionStorage.getItem("ticketData");
    if (!storedTicketData) {
      notification.error({
        message: "No Booking Data",
        description: "Please select seats first before proceeding.",
        duration: 3,
      });
      navigate("/seat-selection");
      return;
    }

    try {
      const data = JSON.parse(storedTicketData);

      // Ensure seatTypes exists with proper structure
      if (!data.seatTypes) {
        const seatsByZone = getSelectedSeatsByZone(data.selectedSeats || []);
        data.seatTypes = {
          deluxe: seatsByZone.deluxe,
          normal: seatsByZone.normal,
        };
      }

      // Ensure deluxe and normal arrays exist
      if (!data.seatTypes.deluxe) {
        data.seatTypes.deluxe = [];
      }
      if (!data.seatTypes.normal) {
        data.seatTypes.normal = [];
      }

      setTicketData(data);
    } catch (error) {
      notification.error({
        message: "Invalid Booking Data",
        description: "Please start your booking process again.",
        duration: 3,
      });
      navigate("/seat-selection");
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        paymentReceipt: e.target.files![0],
      }));
    }
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

  const handleBack = () => {
    navigate("/payment");
  };

  const handleConfirm = async () => {
    if (!validateForm() || !ticketData) {
      return;
    }

    setLoading(true);

    try {
      // Double-check seat availability before confirming
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
        return;
      }

      // Prepare booking data according to the BookingData interface
      const bookingData: BookingData = {
        name: formData.name.trim(),
        ...(formData.studentId.trim() && {
          studentId: formData.studentId.trim(),
        }),
        email: formData.email.trim().toLowerCase(),
        contactNo: formData.contactNo.trim(),
        selectedSeats: ticketData.selectedSeats,
        seatTypes: ticketData.seatTypes,
        totalPrice: ticketData.totalPrice,
        selectedPackages: ticketData.selectedPackages,
        // receiptUrl will be added after upload
      };

      // Create booking with payment receipt
      const result = await createBooking(
        bookingData,
        formData.paymentReceipt ?? undefined
      );

      notification.success({
        message: "Booking Confirmed!",
        description: `Your booking has been submitted successfully.`,
        duration: 8,
      });

      // Clear session storage
      sessionStorage.removeItem("ticketData");

      // Navigate to success page or home
      navigate("/", {
        state: {
          bookingSuccess: true,
          bookingId: result.bookingId,
        },
      });
    } catch (error) {
      console.error("Error creating booking:", error);

      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("no longer available")) {
          errorMessage =
            "One or more selected seats are no longer available. Please select different seats.";
          navigate("/seat-selection");
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

  return (
    <>
      <Header />
      <div className="confirmation-page">
        <div className="confirmation-container">
          <h4>Confirm Your Booking</h4>

          {/* Enhanced Booking Summary */}
          <div className="booking-summary">
            <h6>Booking Summary</h6>

            <div className="summary-section">
              <div className="summary-item">
                <span>Selected Seats:</span>
                <span>{ticketData.selectedSeats.join(", ")}</span>
              </div>
            </div>

            <div className="summary-section">
              <h6 className="section-title">Ticket Breakdown</h6>
              {ticketData.seatTypes?.deluxe?.length > 0 && (
                <div className="summary-item">
                  <span>Deluxe Tickets:</span>
                  <span>{ticketData.seatTypes.deluxe.length} × RM 40</span>
                  <span className="item-total">
                    RM {ticketData.seatTypes.deluxe.length * 40}
                  </span>
                </div>
              )}
              {ticketData.seatTypes?.normal?.length > 0 && (
                <div className="summary-item">
                  <span>Standard Tickets:</span>
                  <span>{ticketData.seatTypes.normal.length} × RM 20</span>
                  <span className="item-total">
                    RM {ticketData.seatTypes.normal.length * 20}
                  </span>
                </div>
              )}
            </div>

            {ticketData.selectedPackages?.length > 0 && (
              <div className="summary-section">
                <div className="summary-item">
                  <span>Packages:</span>
                  <span>{ticketData.selectedPackages.join(", ")}</span>
                </div>
              </div>
            )}

            <div className="summary-divider"></div>

            <div className="summary-item total">
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

                    // Check file size (max 5MB)
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
