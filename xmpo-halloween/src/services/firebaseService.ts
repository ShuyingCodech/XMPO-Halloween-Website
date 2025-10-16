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
import { MERCHANDISE_INVENTORY } from "../contants/MerchandiseInventory";
import { PRODUCTS } from "../contants/Product";

interface MerchQuantityCheck {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface BookingData {
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
  totalMerchPrice: number;
  totalTicketMerchPrice: number;
  selectedPackages: string[];
  merchandise?: Array<{
    productId: string;
    productName: string;
    variantId?: string | null;
    variantName?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
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
    // Step 1: Check seat availability (only if seats were selected)
    if (bookingData.selectedSeats.length > 0) {
      const isAvailable = await checkSeatsAvailability(
        bookingData.selectedSeats
      );
      if (!isAvailable) {
        throw new Error("One or more selected seats are no longer available");
      }
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

    // Step 4: Reserve the seats (only if seats were selected)
    if (bookingData.selectedSeats.length > 0) {
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
    }

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

// Check merchandise availability including bundle decomposition
export const checkMerchandiseAvailability = async (
  items: MerchQuantityCheck[]
): Promise<{ available: boolean; unavailableItems: string[] }> => {
  try {
    const unavailableItems: string[] = [];

    // Get all bookings with merchandise
    const bookingsSnapshot = await getDocs(collection(firestore, "bookings"));

    // Calculate current sold quantities for each product/variant
    const soldQuantities = new Map<string, number>();

    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      if (booking.merchandise && Array.isArray(booking.merchandise)) {
        booking.merchandise.forEach((item: any) => {
          // Decompose bundles into their components
          if (item.productId === "bundle") {
            // Each bundle = 1 keychain + 1 drawstring bag of chosen variant
            const keychainKey = "keychain-null";
            const bagKey = `drawstring-bag-${item.variantId || "null"}`;

            soldQuantities.set(
              keychainKey,
              (soldQuantities.get(keychainKey) || 0) + item.quantity
            );
            soldQuantities.set(
              bagKey,
              (soldQuantities.get(bagKey) || 0) + item.quantity
            );
          } else {
            const key = `${item.productId}-${item.variantId || "null"}`;
            soldQuantities.set(
              key,
              (soldQuantities.get(key) || 0) + item.quantity
            );
          }
        });
      }
    });

    // Decompose items to check (including bundles)
    const decomposedItems: MerchQuantityCheck[] = [];

    items.forEach((item) => {
      if (item.productId === "bundle") {
        // Each bundle needs 1 keychain and 1 bag
        decomposedItems.push({
          productId: "keychain",
          variantId: null,
          quantity: item.quantity,
        });
        decomposedItems.push({
          productId: "drawstring",
          variantId: item.variantId, // The variant chosen for the bag
          quantity: item.quantity,
        });
      } else {
        decomposedItems.push(item);
      }
    });

    // Group decomposed items by product+variant
    const groupedItems = new Map<string, MerchQuantityCheck>();
    decomposedItems.forEach((item) => {
      const key = `${item.productId}-${item.variantId || "null"}`;
      const existing = groupedItems.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        groupedItems.set(key, { ...item });
      }
    });

    // Check each item against inventory limits
    for (const [key, item] of Array.from(groupedItems.entries())) {
      const inventoryItem = MERCHANDISE_INVENTORY.find(
        (inv) =>
          inv.productId === item.productId &&
          (inv.variantId || null) === (item.variantId || null)
      );

      if (!inventoryItem) {
        console.warn(`No inventory limit found for ${key}`);
        continue;
      }

      const currentSold = soldQuantities.get(key) || 0;
      const requestedTotal = currentSold + item.quantity;

      if (requestedTotal > inventoryItem.maxQuantity) {
        const product = PRODUCTS.find((p) => p.id === item.productId);
        const variant = product?.variants?.find((v) => v.id === item.variantId);
        const itemName = variant
          ? `${product?.name} (${variant.name})`
          : product?.name || item.productId;

        const remaining = Math.max(0, inventoryItem.maxQuantity - currentSold);
        unavailableItems.push(`${itemName} `);
      }
    }

    return {
      available: unavailableItems.length === 0,
      unavailableItems,
    };
  } catch (error) {
    console.error("Error checking merchandise availability:", error);
    throw error;
  }
};

// Get remaining stock for a specific item (also accounting for bundles)
export const getRemainingStock = async (
  productId: string,
  variantId?: string | null
): Promise<number> => {
  try {
    const inventoryItem = MERCHANDISE_INVENTORY.find(
      (inv) =>
        inv.productId === productId &&
        (inv.variantId || null) === (variantId || null)
    );

    if (!inventoryItem) {
      return 999; // No limit set
    }

    const bookingsSnapshot = await getDocs(collection(firestore, "bookings"));
    let soldQuantity = 0;

    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      if (booking.merchandise && Array.isArray(booking.merchandise)) {
        booking.merchandise.forEach((item: any) => {
          // Check if this is a bundle that uses this product
          if (item.productId === "bundle") {
            if (productId === "keychain" && variantId === null) {
              // Bundle uses 1 keychain
              soldQuantity += item.quantity;
            } else if (
              productId === "drawstring-bag" &&
              item.variantId === variantId
            ) {
              // Bundle uses 1 bag of the selected variant
              soldQuantity += item.quantity;
            }
          } else if (
            item.productId === productId &&
            (item.variantId || null) === (variantId || null)
          ) {
            soldQuantity += item.quantity;
          }
        });
      }
    });

    return Math.max(0, inventoryItem.maxQuantity - soldQuantity);
  } catch (error) {
    console.error("Error getting remaining stock:", error);
    return 0;
  }
};
