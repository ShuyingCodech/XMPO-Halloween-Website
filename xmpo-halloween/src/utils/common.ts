import { Product } from "../contants/Product";

// Function to check if current time is still in early bird period
export const checkEarlyBirdStatus = (): boolean => {
  // Create date for 18th Sep 2025, 00:00 Malaysia Time (UTC+8)
  const earlyBirdEndDate = new Date("2025-09-18T00:00:00+08:00");
  const now = new Date();

  return now < earlyBirdEndDate;
};

/**
 * Calculate price for a given product and quantity using pack pricing.
 * Greedy algorithm using largest pack counts first (works for common pack schemes).
 *
 * @param product Product
 * @param qty number
 * @returns total price (number)
 */
export const computePriceForProduct = (product: Product, qty: number): number => {
  if (qty <= 0) return 0;

  // Sort packs by count descending so we use the largest packs first.
  const packs = [...product.packs].sort((a, b) => b.count - a.count);

  let remaining = qty;
  let total = 0;

  for (const pack of packs) {
    if (remaining <= 0) break;
    const useCount = Math.floor(remaining / pack.count);
    if (useCount > 0) {
      total += useCount * pack.price;
      remaining -= useCount * pack.count;
    }
  }

  // If some left (e.g., leftover smaller than smallest pack count),
  // we can use the smallest pack price repeated or the single price if it exists.
  if (remaining > 0) {
    // Find pack with count 1, otherwise use smallest pack count price pro-rated (fallback)
    const singlePack = product.packs.find((p) => p.count === 1);
    if (singlePack) {
      total += remaining * singlePack.price;
      remaining = 0;
    } else {
      // fallback: use smallest pack repeatedly
      const smallest = product.packs.reduce(
        (min, p) => (p.count < min.count ? p : min),
        product.packs[0]
      );
      const sets = Math.ceil(remaining / smallest.count);
      total += sets * smallest.price;
      remaining = 0;
    }
  }

  return total;
};
