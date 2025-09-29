export type Product = {
  id: string;
  name: string;
  description: string;
  mainImage?: string;
  additionalImages?: string[];
  /* pricing: list of available packs (count -> price in RM). Eg: [{count:3, price:10}, {count:1, price:4}] */
  packs: { count: number; price: number }[];
  variants?: Variant[]; // if the product requires variant selection (design/size)
  notes?: string;
};

type Variant = {
  id: string;
  name: string;
  thumbnail?: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "keychain",
    name: "Keychain Blind Bag",
    description: `Cute little keychains of our mascot Matzy playing different instruments 
that will bring joy to your purse, bag, or keys! Will luck be on your side 
as you open the blind bag to reveal your instrument?

• Material: Acrylic  
• Size: 5cm × 5cm  
• Collection: Merchandise counter on concert day`,
    mainImage: "./images/product/Acrylic Keychain Main.png",
    additionalImages: ["./images/product/Acrylic Keychain Designs.png"],
    packs: [
      { count: 3, price: 10 }, // RM10 / 3 pcs
      { count: 1, price: 4 },  // RM4 / pc
    ],
    notes: "Blind bag — random design. Collect at merchandise counter.",
  },
  {
    id: "drawstring",
    name: "Drawstring Bag",
    description: `A small canvas drawstring bag perfect for organizing knick-knacks. No more losing small items in your bag!

• Material: Canvas  
• Size: 14cm × 16cm  
• Collection: Merchandise counter on concert day`,
    mainImage: "./images/product/Drawstring Bag - Expressions.png",
    additionalImages: [
      "./images/product/Drawstring Bag - Expressions.png",
      "./images/product/Drawstring Bag - Mosaic.png",
    ],
    packs: [
      { count: 2, price: 10 }, // RM10 / 2 pcs
      { count: 1, price: 6 },  // RM6 / pc
    ],
    variants: [
      {
        id: "expressions",
        name: "Expressions",
        thumbnail: "./images/product/Drawstring Bag - Expressions.png",
      },
      {
        id: "mosaic",
        name: "Mosaic",
        thumbnail: "./images/product/Drawstring Bag - Mosaic.png",
      },
    ],
    notes: "Please select bag design before adding to cart.",
  },
  {
    id: "bundle",
    name: "Keychain + Drawstring Bag Bundle",
    description: `The best of both worlds! Get a cute canvas drawstring bag and 
a random mascot keychain to decorate it with — double the fun!

• Material: Canvas + Acrylic  
• Bag Size: 14cm × 16cm  
• Collection: Merchandise counter on concert day`,
    mainImage: "./images/product/Merchandise Bundle.png",
    additionalImages: [
      "./images/product/Acrylic Keychain Designs.png",
      "./images/product/Drawstring Bag - Expressions.png",
      "./images/product/Drawstring Bag - Mosaic.png",
    ],
    packs: [{ count: 1, price: 9 }], // RM9 / set
    variants: [
      {
        id: "expressions",
        name: "Expressions",
        thumbnail: "./images/product/Drawstring Bag - Expressions.png",
      },
      {
        id: "mosaic",
        name: "Mosaic",
        thumbnail: "./images/product/Drawstring Bag - Mosaic.png",
      },
    ],
    notes: "Bundle includes 1 random keychain + 1 bag (choose design).",
  },
  {
    id: "tshirt",
    name: "Matzy T-Shirt",
    description: `A sleek T-shirt featuring our mascot Matzy! Comfortable and cute, 
perfect for everyday wear.

• Material: Microfiber  
• Sizes: Refer to sizing chart  
• Collection: Merchandise counter on concert day`,
    mainImage: "./images/product/T-Shirt.png",
    additionalImages: ["./images/product/Sizing Chart.jpg"],
    packs: [{ count: 1, price: 28 }], // RM28 / pc
    variants: [
      { id: "s", name: "S" },
      { id: "m", name: "M" },
      { id: "l", name: "L" },
      { id: "xl", name: "XL" },
    ],
    notes: "Check sizing chart before purchase.",
  },
];
