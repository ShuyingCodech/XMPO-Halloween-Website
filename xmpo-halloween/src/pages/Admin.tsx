import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "../firebase";
import { Checkbox } from "antd";
import "../styles/admin.css";

interface BookingDetails {
  id: string;
  name: string;
  studentId?: string;
  email: string;
  contactNo: string;
  selectedSeats: string[];
  seatTypes: {
    deluxe: string[];
    normal: string[];
  };
  totalPrice: number;
  selectedPackages: string[];
  receiptUrl: string;
  createdAt: any;
  redeemed: boolean; // Added redeemed field
}

const Admin: React.FC = () => {
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDetails[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(firestore, "bookings"));
      const bookingsData: BookingDetails[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookingsData.push({
          id: doc.id,
          ...data,
          redeemed: data.redeemed || false, // Initialize redeemed if not exists
        } as BookingDetails);
      });

      setBookings(bookingsData);
      setFilteredBookings(bookingsData);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = bookings.filter((booking) => {
      const matchesSearch =
        booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.studentId &&
          booking.studentId.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "createdAt":
          const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
          const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
          return bTime - aTime;
        case "name":
          return a.name.localeCompare(b.name);
        case "totalPrice":
          return b.totalPrice - a.totalPrice;
        case "seatCount":
          return b.selectedSeats.length - a.selectedSeats.length;
        default:
          return 0;
      }
    });

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, sortBy]);

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        await deleteDoc(doc(firestore, "bookings", bookingId));
        await loadBookings();
        alert("Booking deleted successfully!");
      } catch (error) {
        console.error("Error deleting booking:", error);
        alert("Error deleting booking. Please try again.");
      }
    }
  };

  const handleRedeemChange = async (bookingId: string, checked: boolean) => {
    try {
      await updateDoc(doc(firestore, "bookings", bookingId), {
        redeemed: checked,
      });
      await loadBookings();
    } catch (error) {
      console.error("Error updating redeem status:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalRevenue = () => {
    return filteredBookings.reduce(
      (total, booking) => total + booking.totalPrice,
      0
    );
  };

  const getTotalSeats = () => {
    return filteredBookings.reduce(
      (total, booking) => total + booking.selectedSeats.length,
      0
    );
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Payment Records</h1>
      </div>

      <div className="admin-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-container">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="createdAt">Latest First</option>
            <option value="name">Customer Name</option>
            <option value="totalPrice">Amount (High to Low)</option>
            <option value="seatCount">Seat Count</option>
          </select>
        </div>

        <div className="refresh-container">
          <button
            onClick={loadBookings}
            className="refresh-btn"
            disabled={loading}
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="bookings-table-container">
        {filteredBookings.length === 0 ? (
          <div className="no-bookings">
            <p>No bookings found.</p>
          </div>
        ) : (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Customer Details</th>
                <th>Seats & Pricing</th>
                <th>Packages</th>
                <th>Total Amount</th>
                <th>Receipt</th>
                <th>Booking Time</th>
                <th>Redeemed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <div className="customer-info">
                      <strong>{booking.name}</strong>
                      {booking.studentId && (
                        <div className="student-id">
                          Student ID: {booking.studentId}
                        </div>
                      )}
                      <div className="contact-details">
                        <div>{booking.email}</div>
                        <div className="phone">{booking.contactNo}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="seat-info">
                      <div className="seats-list">
                        <strong>Seats:</strong>{" "}
                        {booking.selectedSeats.join(", ")}
                      </div>
                      {booking.seatTypes?.deluxe?.length > 0 && (
                        <div className="seat-type">
                          Deluxe: {booking.seatTypes.deluxe.length} × RM 40
                        </div>
                      )}
                      {booking.seatTypes?.normal?.length > 0 && (
                        <div className="seat-type">
                          Standard: {booking.seatTypes.normal.length} × RM 20
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="packages">
                      {booking.selectedPackages?.length > 0
                        ? booking.selectedPackages.join(", ")
                        : "None"}
                    </div>
                  </td>
                  <td className="amount">
                    {formatCurrency(booking.totalPrice)}
                  </td>
                  <td>
                    {booking.receiptUrl ? (
                      <a
                        href={booking.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="receipt-link"
                      >
                        View Receipt
                      </a>
                    ) : (
                      <span className="no-receipt">No receipt</span>
                    )}
                  </td>
                  <td className="booking-time">
                    {formatDate(booking.createdAt)}
                  </td>
                  <td>
                    <Checkbox
                      checked={booking.redeemed}
                      onChange={(e) =>
                        handleRedeemChange(booking.id, e.target.checked)
                      }
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="delete-btn"
                      title="Delete booking"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Admin;
