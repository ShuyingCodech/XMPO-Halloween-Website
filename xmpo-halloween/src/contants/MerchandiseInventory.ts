export interface MerchandiseInventory {
  productId: string;
  variantId?: string | null;
  maxQuantity: number;
}

export const MERCHANDISE_INVENTORY: MerchandiseInventory[] = [
  // Keychain Blind Bag
  {
    productId: "keychain",
    variantId: null,
    maxQuantity: 220,
  },
  // Drawstring Bag - Design 1
  {
    productId: "drawstring",
    variantId: "expressions",
    maxQuantity: 70,
  },
  // Drawstring Bag - Design 2
  {
    productId: "drawstring",
    variantId: "mosaic",
    maxQuantity: 70,
  },
  // T-shirt - XS
  {
    productId: "tshirt",
    variantId: "xs",
    maxQuantity: 4,
  },
  // T-shirt - S
  {
    productId: "tshirt",
    variantId: "s",
    maxQuantity: 10,
  },
  // T-shirt - M
  {
    productId: "tshirt",
    variantId: "m",
    maxQuantity: 14,
  },
  // T-shirt - L
  {
    productId: "tshirt",
    variantId: "l",
    maxQuantity: 14,
  },
  // T-shirt - XL
  {
    productId: "tshirt",
    variantId: "xl",
    maxQuantity: 8,
  },
];
