// ============================================================
// AURELLE — 10 E-COMMERCE PRODUCT CATEGORIES & SUBCATEGORIES
// Master definition corresponding to "THE ESSENTIALS" UI system
// ============================================================

export interface CategoryDefinition {
  id?: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  image_url?: string | null;
  image_public_id?: string | null;
  subcategories: Array<{
    name: string;
    slug: string;
    sort_order: number;
  }>;
}

export const AURELLE_CATEGORIES: CategoryDefinition[] = [
  {
    name: "Cosmetics & Makeup",
    slug: "cosmetics-makeup",
    description: "Luxury cosmetics, makeup essentials, lip care and beauty tools.",
    sort_order: 1,
    subcategories: [
      { name: "Makeup", slug: "makeup", sort_order: 1 },
      { name: "Lip Care", slug: "lip-care", sort_order: 2 },
      { name: "Foundation", slug: "foundation", sort_order: 3 },
      { name: "Concealer", slug: "concealer", sort_order: 4 },
      { name: "Eye Makeup", slug: "eye-makeup", sort_order: 5 },
      { name: "Beauty Tools", slug: "beauty-tools", sort_order: 6 },
    ],
  },
  {
    name: "Skincare & Body Care",
    slug: "skincare-body-care",
    description: "High-performance face washes, serums, moisturizers, and body care.",
    sort_order: 2,
    subcategories: [
      { name: "Face Wash", slug: "face-wash", sort_order: 1 },
      { name: "Moisturizers", slug: "moisturizers", sort_order: 2 },
      { name: "Creams", slug: "creams", sort_order: 3 },
      { name: "Lotions", slug: "lotions", sort_order: 4 },
      { name: "Serums", slug: "serums", sort_order: 5 },
      { name: "Sunscreen", slug: "sunscreen", sort_order: 6 },
      { name: "Body-Care Products", slug: "body-care-products", sort_order: 7 },
    ],
  },
  {
    name: "Hair Care",
    slug: "hair-care",
    description: "Professional shampoos, conditioners, restorative hair oils and treatments.",
    sort_order: 3,
    subcategories: [
      { name: "Shampoo", slug: "shampoo", sort_order: 1 },
      { name: "Conditioner", slug: "conditioner", sort_order: 2 },
      { name: "Hair Oils", slug: "hair-oils", sort_order: 3 },
      { name: "Hair Treatments", slug: "hair-treatments", sort_order: 4 },
      { name: "Styling Products", slug: "styling-products", sort_order: 5 },
    ],
  },
  {
    name: "Personal Care & Hygiene",
    slug: "personal-care-hygiene",
    description: "Everyday soaps, shower gels, oral care, shaving and hygiene essentials.",
    sort_order: 4,
    subcategories: [
      { name: "Soaps", slug: "soaps", sort_order: 1 },
      { name: "Shower Gels", slug: "shower-gels", sort_order: 2 },
      { name: "Oral-Care Products", slug: "oral-care-products", sort_order: 3 },
      { name: "Shaving Products", slug: "shaving-products", sort_order: 4 },
      { name: "Deodorants", slug: "deodorants", sort_order: 5 },
      { name: "Hygiene Products", slug: "hygiene-products", sort_order: 6 },
    ],
  },
  {
    name: "Baby Care Products",
    slug: "baby-care",
    description: "Gentle baby toiletries, lotions, shampoos, and comfort accessories.",
    sort_order: 5,
    subcategories: [
      { name: "Baby Toiletries", slug: "baby-toiletries", sort_order: 1 },
      { name: "Baby Lotions", slug: "baby-lotions", sort_order: 2 },
      { name: "Baby Shampoos", slug: "baby-shampoos", sort_order: 3 },
      { name: "Baby Hygiene Products", slug: "baby-hygiene-products", sort_order: 4 },
      { name: "Diapers", slug: "diapers", sort_order: 5 },
      { name: "Feeding & Grooming Accessories", slug: "feeding-grooming-accessories", sort_order: 6 },
    ],
  },
  {
    name: "Health & Wellness Products",
    slug: "health-wellness",
    description: "Topical wellness, vapor balms, cooling patches, and first-aid essentials.",
    sort_order: 6,
    subcategories: [
      { name: "Topical Wellness Products", slug: "topical-wellness", sort_order: 1 },
      { name: "Vapor Rubs & Balms", slug: "vapor-rubs-balms", sort_order: 2 },
      { name: "Inhalation & Cold Relief", slug: "inhalation-cold-relief", sort_order: 3 },
      { name: "Heat & Cooling Patches", slug: "heat-cooling-patches", sort_order: 4 },
      { name: "General Wellness & Comfort", slug: "general-wellness", sort_order: 5 },
      { name: "First-Aid & Basic Healthcare", slug: "first-aid-accessories", sort_order: 6 },
    ],
  },
  {
    name: "Grooming & Beauty Accessories",
    slug: "grooming-accessories",
    description: "Combs, brushes, mirrors, manicure tools, and cosmetic organizers.",
    sort_order: 7,
    subcategories: [
      { name: "Combs", slug: "combs", sort_order: 1 },
      { name: "Brushes", slug: "brushes", sort_order: 2 },
      { name: "Mirrors", slug: "mirrors", sort_order: 3 },
      { name: "Manicure & Pedicure Items", slug: "manicure-pedicure", sort_order: 4 },
      { name: "Cosmetic Bags & Organizers", slug: "cosmetic-bags-organizers", sort_order: 5 },
    ],
  },
  {
    name: "Household & Lifestyle Products",
    slug: "household-lifestyle",
    description: "Household essentials, cleaning accessories, storage and travel items.",
    sort_order: 8,
    subcategories: [
      { name: "Household Essentials", slug: "household-essentials", sort_order: 1 },
      { name: "Cleaning Accessories", slug: "cleaning-accessories", sort_order: 2 },
      { name: "Storage Products", slug: "storage-products", sort_order: 3 },
      { name: "Travel Items", slug: "travel-items", sort_order: 4 },
      { name: "Lifestyle Accessories", slug: "lifestyle-accessories", sort_order: 5 },
    ],
  },
  {
    name: "Perfumes & Fragrances",
    slug: "perfumes-fragrances",
    description: "Captivating Arabian & French perfumes, luxury body sprays and sets.",
    sort_order: 9,
    subcategories: [
      { name: "Perfumes", slug: "perfumes", sort_order: 1 },
      { name: "Fragrances", slug: "fragrances", sort_order: 2 },
      { name: "Body Sprays", slug: "body-sprays", sort_order: 3 },
      { name: "Fragrance Deodorants", slug: "fragrance-deodorants", sort_order: 4 },
      { name: "Fragrance Sets", slug: "fragrance-sets", sort_order: 5 },
    ],
  },
  {
    name: "General Consumer Goods",
    slug: "general-consumer-goods",
    description: "Gift items, everyday essentials, and convenience lifestyle products.",
    sort_order: 10,
    subcategories: [
      { name: "Gift Items", slug: "gift-items", sort_order: 1 },
      { name: "Everyday-Use Products", slug: "everyday-use-products", sort_order: 2 },
      { name: "Convenience Products", slug: "convenience-products", sort_order: 3 },
      { name: "Other Consumer Goods", slug: "other-consumer-goods", sort_order: 4 },
    ],
  },
];
