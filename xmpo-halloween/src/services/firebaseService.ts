// services/bookingService.ts
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, imageStorage } from "../firebase";

// Types
export interface BookingData {
  name: string;
  studentId?: string;
  email: string;
  contactNo: string;
  receiptUrl?: string;
  selectedSeats: string[];
  seatTypes: {
    deluxe: string[];
    normal: string[];
  };
  totalPrice: number;
  selectedPackages: string[];
}

export interface ReservedSeat {
  seatCode: string;
  isReserved: boolean;
  bookingId: string;
  reservedAt: Timestamp;
  status: "pending" | "confirmed" | "cancelled";
  customerEmail: string;
}

// Get all reserved seats
export const getReservedSeats = async (): Promise<string[]> => {
  try {
    const reservedSeatsQuery = query(
      collection(firestore, "reserved_seats"),
      where("isReserved", "==", true),
      where("status", "in", ["pending", "confirmed"])
    );

    const querySnapshot = await getDocs(reservedSeatsQuery);
    const reservedSeats: string[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as ReservedSeat;
      reservedSeats.push(data.seatCode);
    });

    return reservedSeats;
  } catch (error) {
    console.error("Error fetching reserved seats:", error);
    throw new Error("Failed to fetch reserved seats");
  }
};

// Check if seats are available
export const checkSeatsAvailability = async (
  seatCodes: string[]
): Promise<boolean> => {
  try {
    const reservedSeats = await getReservedSeats();
    return !seatCodes.some((seat) => reservedSeats.includes(seat));
  } catch (error) {
    console.error("Error checking seat availability:", error);
    throw error;
  }
};

// Upload payment receipt
export const uploadPaymentReceipt = async (
  file: File,
  bookingId: string
): Promise<string> => {
  try {
    console.log("Uploading receipt for booking ID:", bookingId);
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `receipts/${bookingId}_${timestamp}.${fileExtension}`;
    const storageRef = ref(imageStorage, fileName);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading receipt:", error);
    throw new Error("Failed to upload payment receipt");
  }
};

// Create new booking with transaction
export const createBooking = async (
  bookingData: BookingData,
  receiptFile?: File
): Promise<{ bookingId: string; receiptUrl?: string }> => {
  try {
    // Step 1: Check seat availability
    const isAvailable = await checkSeatsAvailability(bookingData.selectedSeats);
    if (!isAvailable) {
      throw new Error("One or more selected seats are no longer available");
    }

    // Step 2: Create booking document
    const bookingRef = await addDoc(collection(firestore, "bookings"), {
      ...bookingData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    let receiptUrl: string | undefined;

    // Step 3: Upload receipt if provided
    if (receiptFile) {
      receiptUrl = await uploadPaymentReceipt(receiptFile, bookingRef.id);

      // Update booking with receipt URL
      await updateDoc(bookingRef, {
        receiptUrl: receiptUrl,
        updatedAt: serverTimestamp(),
      });
    }

    // Step 4: Reserve the seats
    const seatReservations: Omit<ReservedSeat, "reservedAt">[] =
      bookingData.selectedSeats.map((seatCode) => ({
        seatCode,
        isReserved: true,
        bookingId: bookingRef.id,
        status: "pending" as const,
        customerEmail: bookingData.email,
      }));

    // Add reserved seats to collection
    const reservationPromises = seatReservations.map((reservation) =>
      addDoc(collection(firestore, "reserved_seats"), {
        ...reservation,
        reservedAt: serverTimestamp(),
      })
    );

    await Promise.all(reservationPromises);

    return {
      bookingId: bookingRef.id,
      receiptUrl,
    };
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

// Get booking by ID
export const getBookingById = async (bookingId: string) => {
  try {
    const bookingDoc = await getDoc(doc(firestore, "bookings", bookingId));

    if (!bookingDoc.exists()) {
      throw new Error("Booking not found");
    }

    return {
      id: bookingDoc.id,
      ...bookingDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }
};

// Get all bookings (admin function)
export const getAllBookings = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestore, "bookings"));
    const bookings: any[] = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bookings;
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    throw error;
  }
};

// Get bookings by customer email
export const getBookingsByEmail = async (email: string) => {
  try {
    const bookingsQuery = query(
      collection(firestore, "bookings"),
      where("email", "==", email)
    );

    const querySnapshot = await getDocs(bookingsQuery);
    const bookings: any[] = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bookings;
  } catch (error) {
    console.error("Error fetching bookings by email:", error);
    throw error;
  }
};

// Clean up expired pending bookings (should be run periodically)
export const cleanupExpiredBookings = async (
  expirationHours: number = 24
): Promise<void> => {
  try {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() - expirationHours);

    const expiredBookingsQuery = query(
      collection(firestore, "bookings"),
      where("status", "==", "pending"),
      where("createdAt", "<", Timestamp.fromDate(expirationDate))
    );

    const querySnapshot = await getDocs(expiredBookingsQuery);

    const cleanupPromises: Promise<void>[] = [];

    querySnapshot.forEach((doc) => {
      cleanupPromises.push(
        updateDoc(doc.ref, {
          status: "expired",
          updatedAt: serverTimestamp(),
        })
      );

      // Also release the seats
      const releaseSeatsPromise = query(
        collection(firestore, "reserved_seats"),
        where("bookingId", "==", doc.id)
      );

      getDocs(releaseSeatsPromise).then((seatsSnapshot) => {
        const seatUpdatePromises: Promise<void>[] = [];
        seatsSnapshot.forEach((seatDoc) => {
          seatUpdatePromises.push(
            updateDoc(seatDoc.ref, {
              status: "expired",
              isReserved: false,
            })
          );
        });
        return Promise.all(seatUpdatePromises);
      });
    });

    await Promise.all(cleanupPromises);
  } catch (error) {
    console.error("Error cleaning up expired bookings:", error);
    throw error;
  }
};
