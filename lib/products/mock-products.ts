export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description: string;
  retail_price: number;
  compare_at_price?: number;
  category_id: string;
  category_slug: string;
  category_name: string;
  subcategory: string;
  brand_name: string;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  images: {
    url: string;
    alt: string;
    is_primary: boolean;
  }[];
  stock_quantity: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  wholesale_moq: number;
  wholesale_price: number;
  rating: number;
  reviews_count: number;
  tags: string[];
  ingredients?: string;
  how_to_use?: string;
}

export const AURELLE_PRODUCTS: ProductItem[] = [
  // ── 1. Cosmetics & Makeup ───────────────────────────────────────────
  {
    id: "prod-cosm-01",
    name: "Velvet Matte Silk Lipstick — Desert Rose",
    slug: "velvet-matte-silk-lipstick-desert-rose",
    sku: "AUR-LIP-001",
    short_description: "Long-lasting weightless satin matte finish enriched with argan and rosehip oil.",
    description: "An intensely pigmented, feather-light matte lipstick formulated for all-day comfort. Infused with nourishing Moroccan argan oil and botanical rosehip to ensure lips stay supple, velvety, and hydrated even in arid UAE climates.",
    retail_price: 115,
    compare_at_price: 145,
    category_id: "cosmetics-makeup",
    category_slug: "cosmetics-makeup",
    category_name: "Cosmetics & Makeup",
    subcategory: "Lip Care",
    brand_name: "Aurelle Atelier",
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
        alt: "Velvet Matte Silk Lipstick in Desert Rose",
        is_primary: true,
      },
      {
        url: "https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?auto=format&fit=crop&w=800&q=80",
        alt: "Lipstick swatch and luxury casing",
        is_primary: false,
      },
    ],
    stock_quantity: 48,
    stock_status: "in_stock",
    wholesale_moq: 24,
    wholesale_price: 68,
    rating: 4.9,
    reviews_count: 84,
    tags: ["Best Seller", "Cruelty-Free", "Hydrating"],
    ingredients: "Dimethicone, Synthetic Wax, Argania Spinosa Kernel Oil, Rosa Canina Fruit Oil, Tocopheryl Acetate (Vitamin E), Iron Oxides (CI 77491, CI 77492, CI 77499).",
    how_to_use: "Glide directly across clean, exfoliated lips starting from the Cupid's bow and blending outward. Layer for intensified depth.",
  },
  {
    id: "prod-cosm-02",
    name: "Luminous Filter Skin Tint SPF 30",
    slug: "luminous-filter-skin-tint-spf-30",
    sku: "AUR-FND-002",
    short_description: "Breathable, radiance-boosting complexion tint with mineral broad-spectrum protection.",
    description: "Your second-skin glow in a bottle. This lightweight tint evens tone, diffuses pores, and delivers a fresh, lit-from-within finish while shielding skin from harsh sun rays and environmental pollution.",
    retail_price: 165,
    compare_at_price: 195,
    category_id: "cosmetics-makeup",
    category_slug: "cosmetics-makeup",
    category_name: "Cosmetics & Makeup",
    subcategory: "Foundation",
    brand_name: "Aurelle Atelier",
    is_featured: true,
    is_best_seller: false,
    is_new_arrival: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=800&q=80",
        alt: "Luminous Skin Tint Bottle with Dropper",
        is_primary: true,
      },
    ],
    stock_quantity: 35,
    stock_status: "in_stock",
    wholesale_moq: 18,
    wholesale_price: 98,
    rating: 4.8,
    reviews_count: 42,
    tags: ["SPF 30", "Clean Beauty", "Natural Finish"],
    ingredients: "Zinc Oxide 12%, Niacinamide, Hyaluronic Acid, Squalane, Water/Aqua, Camellia Sinensis Leaf Extract.",
    how_to_use: "Shake well before use. Dispense 2-3 drops onto fingertips or beauty sponge and smooth evenly over face and neck.",
  },

  // ── 2. Skincare & Body Care ─────────────────────────────────────────
  {
    id: "prod-skin-01",
    name: "Multi-Hyaluronic Marine Moisture Cream",
    slug: "multi-hyaluronic-marine-moisture-cream",
    sku: "AUR-SKN-010",
    short_description: "Deep quenching gel-cream infused with 5 molecular weights of hyaluronic acid and algae.",
    description: "Designed for intense hydration in air-conditioned and high-heat environments. Penetrates deep epidermal layers to restore moisture barriers without greasy residue.",
    retail_price: 195,
    compare_at_price: 240,
    category_id: "skincare-body-care",
    category_slug: "skincare-body-care",
    category_name: "Skincare & Body Care",
    subcategory: "Moisturizers",
    brand_name: "Aurelle Botanicals",
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
        alt: "Marine Moisture Cream minimalist jar",
        is_primary: true,
      },
    ],
    stock_quantity: 62,
    stock_status: "in_stock",
    wholesale_moq: 20,
    wholesale_price: 110,
    rating: 5.0,
    reviews_count: 118,
    tags: ["Award Winner", "Fragrance-Free", "Dermatologist Tested"],
    ingredients: "Aqua, Sodium Hyaluronate (Multi-molecular), Marine Collagen, Sea Kelp Extract, Ceramide NP, Glycerin.",
    how_to_use: "Gently massage a hazelnut-sized amount onto cleansed face and neck morning and evening.",
  },
  {
    id: "prod-skin-02",
    name: "Golden Nectar Radiance Vitamin C Serum",
    slug: "golden-nectar-radiance-vitamin-c-serum",
    sku: "AUR-SKN-011",
    short_description: "15% stabilized Vitamin C + Ferulic Acid antioxidant brightening elixir.",
    description: "Fades dark spots, sun damage, and hyperpigmentation while boosting collagen synthesis. Leaves dull skin vibrant, luminous, and firm within 14 days of continuous use.",
    retail_price: 220,
    compare_at_price: 275,
    category_id: "skincare-body-care",
    category_slug: "skincare-body-care",
    category_name: "Skincare & Body Care",
    subcategory: "Serums",
    brand_name: "Aurelle Botanicals",
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
        alt: "Golden Nectar Serum Amber Glass Bottle",
        is_primary: true,
      },
    ],
    stock_quantity: 28,
    stock_status: "in_stock",
    wholesale_moq: 15,
    wholesale_price: 125,
    rating: 4.9,
    reviews_count: 96,
    tags: ["Best Seller", "Brightening", "Antioxidant"],
    ingredients: "Ascorbyl Tetraisopalmitate 15%, Ferulic Acid, Kakadu Plum Extract, Vitamin E, Squalane.",
    how_to_use: "Apply 4-5 drops to freshly cleansed skin every morning before moisturizer and sunscreen.",
  },

  // ── 3. Hair Care ───────────────────────────────────────────────────
  {
    id: "prod-hair-01",
    name: "Argan & Golden Jojoba Elixir Hair Oil",
    slug: "argan-golden-jojoba-elixir-hair-oil",
    sku: "AUR-HAR-020",
    short_description: "Silkening restorative oil that tames frizz, protects against heat, and adds glossy shine.",
    description: "Formulated with cold-pressed Moroccan argan oil and organic golden jojoba to seal split ends, reduce humidity-induced frizz, and shield hair from styling temperatures up to 230°C.",
    retail_price: 140,
    compare_at_price: 175,
    category_id: "hair-care",
    category_slug: "hair-care",
    category_name: "Hair Care",
    subcategory: "Hair Oils",
    brand_name: "Aurelle Professional",
    is_featured: false,
    is_best_seller: true,
    is_new_arrival: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1608248597359-598d1a1081a9?auto=format&fit=crop&w=800&q=80",
        alt: "Hair Oil Glass Dispenser",
        is_primary: true,
      },
    ],
    stock_quantity: 45,
    stock_status: "in_stock",
    wholesale_moq: 24,
    wholesale_price: 78,
    rating: 4.8,
    reviews_count: 67,
    tags: ["Heat Protection", "Anti-Frizz", "Cold-Pressed"],
    ingredients: "Argania Spinosa Kernel Oil, Simmondsia Chinensis Seed Oil, Camellia Oleifera Seed Oil, Fragrance.",
    how_to_use: "Rub 1-2 pumps between palms and distribute evenly from mid-lengths to ends of damp or dry hair.",
  },

  // ── 4. Personal Care & Hygiene ─────────────────────────────────────
  {
    id: "prod-pers-01",
    name: "Botanical Cedar & White Amber Shower Gel",
    slug: "botanical-cedar-white-amber-shower-gel",
    sku: "AUR-PER-030",
    short_description: "Gentle pH-balanced body wash infused with aloe vera, cedarwood, and delicate amber.",
    description: "Transform your daily shower into a spa ritual. Rich foaming lather gently cleanses while leaving skin delicately scented with earthy cedar and warm white amber.",
    retail_price: 85,
    compare_at_price: 105,
    category_id: "personal-care-hygiene",
    category_slug: "personal-care-hygiene",
    category_name: "Personal Care & Hygiene",
    subcategory: "Shower Gels",
    brand_name: "Aurelle Essentials",
    is_featured: false,
    is_best_seller: false,
    is_new_arrival: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
        alt: "Aurelle Amber Shower Gel Bottle",
        is_primary: true,
      },
    ],
    stock_quantity: 75,
    stock_status: "in_stock",
    wholesale_moq: 36,
    wholesale_price: 46,
    rating: 4.7,
    reviews_count: 31,
    tags: ["Sulfate-Free", "Aromatherapy", "Daily Use"],
    ingredients: "Aqua, Cocamidopropyl Betaine, Sodium Cocoyl Isethionate, Aloe Barbadensis Leaf Juice, Cedarwood Oil.",
    how_to_use: "Lather generously over damp skin with hands or bath sponge, then rinse thoroughly.",
  },

  // ── 5. Baby Care Products ──────────────────────────────────────────
  {
    id: "prod-baby-01",
    name: "Ultra-Calm Oat & Chamomile Baby Wash & Shampoo",
    slug: "ultra-calm-oat-chamomile-baby-wash",
    sku: "AUR-BBY-040",
    short_description: "Tear-free, pediatric-tested 2-in-1 head-to-toe cleanser for sensitive infant skin.",
    description: "Created with colloidal oatmeal, organic German chamomile, and provitamin B5. Clinically proven to soothe cradle cap, dryness, and diaper-adjacent sensitivity.",
    retail_price: 75,
    compare_at_price: 90,
    category_id: "baby-care",
    category_slug: "baby-care",
    category_name: "Baby Care Products",
    subcategory: "Baby Shampoos",
    brand_name: "Aurelle Petit",
    is_featured: false,
    is_best_seller: true,
    is_new_arrival: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80",
        alt: "Baby gentle cleanser bottle with pump",
        is_primary: true,
      },
    ],
    stock_quantity: 50,
    stock_status: "in_stock",
    wholesale_moq: 30,
    wholesale_price: 42,
    rating: 4.9,
    reviews_count: 53,
    tags: ["Pediatrician Approved", "Tear-Free", "Hypoallergenic"],
    ingredients: "Avena Sativa (Oat) Kernel Flour, Chamomilla Recutita Flower Extract, Panthenol, Glycerin.",
    how_to_use: "Apply a small amount to baby's wet hair and skin, gently lather, and rinse with warm water.",
  },

  // ── 6. Health & Wellness Products ──────────────────────────────────
  {
    id: "prod-well-01",
    name: "Eucalyptus & Camphor Herbal Vapor Balm",
    slug: "eucalyptus-camphor-herbal-vapor-balm",
    sku: "AUR-WEL-050",
    short_description: "Therapeutic soothing topical balm for chest congestion, cooling relief, and muscle ease.",
    description: "Handcrafted with natural eucalyptus globulus, menthol crystals, and wintergreen. Delivers penetrating herbal aromatics to clear airways and soothe tired muscles after long days.",
    retail_price: 55,
    compare_at_price: 70,
    category_id: "health-wellness",
    category_slug: "health-wellness",
    category_name: "Health & Wellness Products",
    subcategory: "Vapor Rubs & Balms",
    brand_name: "Aurelle Wellness",
    is_featured: false,
    is_best_seller: true,
    is_new_arrival: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
        alt: "Herbal Balm glass jar with silver cap",
        is_primary: true,
      },
    ],
    stock_quantity: 80,
    stock_status: "in_stock",
    wholesale_moq: 48,
    wholesale_price: 28,
    rating: 4.8,
    reviews_count: 76,
    tags: ["Herbal Remedy", "Instant Relief", "Essential Oils"],
    ingredients: "Menthol 2.6%, Camphor 4.8%, Eucalyptus Oil 1.2%, Petrolatum, Beeswax, Thymol.",
    how_to_use: "Rub gently onto chest, throat, and back. For muscular ache, massage deeply into affected joints.",
  },

  // ── 7. Grooming & Beauty Accessories ───────────────────────────────
  {
    id: "prod-grm-01",
    name: "Handcrafted Rose Quartz Sculpting Gua Sha & Roller Set",
    slug: "rose-quartz-gua-sha-roller-set",
    sku: "AUR-ACC-060",
    short_description: "100% natural Brazilian rose quartz beauty tools for lymphatic drainage and facial contouring.",
    description: "Elevate your skincare absorption with genuine Brazilian rose quartz. Reduces puffiness, stimulates microcirculation, and relieves jaw tension.",
    retail_price: 135,
    compare_at_price: 170,
    category_id: "grooming-accessories",
    category_slug: "grooming-accessories",
    category_name: "Grooming & Beauty Accessories",
    subcategory: "Brushes & Tools",
    brand_name: "Aurelle Atelier",
    is_featured: true,
    is_best_seller: false,
    is_new_arrival: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
        alt: "Rose Quartz Facial Roller and Gua Sha tool",
        is_primary: true,
      },
    ],
    stock_quantity: 40,
    stock_status: "in_stock",
    wholesale_moq: 20,
    wholesale_price: 72,
    rating: 4.9,
    reviews_count: 45,
    tags: ["Natural Stone", "Lymphatic Drainage", "Luxury Gift"],
    ingredients: "100% Certified Grade-A Rose Quartz Stone, Reinforced Zinc Alloy Frame.",
    how_to_use: "Apply facial oil or serum first. Glide roller upward and outward along cheekbones, jawline, and forehead.",
  },

  // ── 8. Household & Lifestyle Products ──────────────────────────────
  {
    id: "prod-life-01",
    name: "Aromatherapeutic Linen & Room Mist — White Fig & Vetiver",
    slug: "aromatherapeutic-linen-room-mist-fig-vetiver",
    sku: "AUR-HOU-070",
    short_description: "Botanical home ambiance mist that refreshes fabrics, sheets, and living spaces.",
    description: "An evocative blend of sun-warmed Mediterranean fig, earthy Haitian vetiver, and crisp cedar. Formulated without harsh chemicals or synthetic dyes to safely scent linens and living spaces.",
    retail_price: 95,
    compare_at_price: 120,
    category_id: "household-lifestyle",
    category_slug: "household-lifestyle",
    category_name: "Household & Lifestyle Products",
    subcategory: "Household Essentials",
    brand_name: "Aurelle Maison",
    is_featured: false,
    is_best_seller: false,
    is_new_arrival: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
        alt: "Linen Mist spray bottle in luxury interior setting",
        is_primary: true,
      },
    ],
    stock_quantity: 30,
    stock_status: "in_stock",
    wholesale_moq: 24,
    wholesale_price: 52,
    rating: 4.8,
    reviews_count: 22,
    tags: ["Non-Toxic", "Long Lasting", "Home Fragrance"],
    ingredients: "Distilled Water, Alcohol Denat., Fragrance (Parfum), Glycerin, Cedarwood & Vetiver Oils.",
    how_to_use: "Mist liberally 30cm away from pillows, curtains, and linens. Can also be spritzed into the air.",
  },

  // ── 9. Perfumes & Fragrances ───────────────────────────────────────
  {
    id: "prod-perf-01",
    name: "Oud Royale Extrait de Parfum 100ml",
    slug: "oud-royale-extrait-de-parfum",
    sku: "AUR-PRF-080",
    short_description: "A majestic oriental composition of aged Cambodian oud, damascena rose, and golden saffron.",
    description: "Crafted in Grasse and blended with prestigious Gulf aromatics. Opens with spicy saffron and pink pepper, evolves into velvety taif rose, and settles into intoxicating aged oud and smoky leather.",
    retail_price: 480,
    compare_at_price: 590,
    category_id: "perfumes-fragrances",
    category_slug: "perfumes-fragrances",
    category_name: "Perfumes & Fragrances",
    subcategory: "Extrait de Parfum",
    brand_name: "Aurelle Haute Parfumerie",
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
        alt: "Oud Royale heavy crystal perfume bottle with gold detailing",
        is_primary: true,
      },
    ],
    stock_quantity: 22,
    stock_status: "in_stock",
    wholesale_moq: 12,
    wholesale_price: 260,
    rating: 5.0,
    reviews_count: 142,
    tags: ["Signature Scent", "30% Concentration", "Luxury Oud"],
    ingredients: "Alcohol Denat., Parfum (Fragrance), Aqua, Limonene, Linalool, Alpha-Isomethyl Ionone.",
    how_to_use: "Spritz lightly onto pulse points: neck, wrists, and collarbones. Allow to develop naturally without rubbing.",
  },

  // ── 10. Seasonal & Promotional Gift Sets ───────────────────────────
  {
    id: "prod-gift-01",
    name: "The Grand Aurelle Discovery Gift Coffret",
    slug: "grand-aurelle-discovery-gift-coffret",
    sku: "AUR-GFT-090",
    short_description: "5-piece curated collection of our most coveted skincare and fragrance formulations in a keepsake gold box.",
    description: "The ultimate luxury indulgence. Includes full-size Marine Moisture Cream, Vitamin C Serum, Mini Oud Royale 15ml, Velvet Lip Silk, and Rose Quartz Roller nestled in velvet-lined packaging.",
    retail_price: 650,
    compare_at_price: 820,
    category_id: "seasonal-promotional",
    category_slug: "seasonal-promotional",
    category_name: "Seasonal & Promotional Gift Sets",
    subcategory: "Gift Sets",
    brand_name: "Aurelle Signature",
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1512290900672-1f4a476bb44e?auto=format&fit=crop&w=800&q=80",
        alt: "Luxury Gold Gift Box with Beauty Assortment",
        is_primary: true,
      },
    ],
    stock_quantity: 18,
    stock_status: "low_stock",
    wholesale_moq: 10,
    wholesale_price: 360,
    rating: 5.0,
    reviews_count: 88,
    tags: ["Limited Edition", "Full Size Set", "Luxury Gifting"],
    ingredients: "See individual product descriptions for ingredient listings.",
    how_to_use: "Unbox and follow individual product rituals morning and night.",
  },
];

export function getProductBySlug(slug: string): ProductItem | undefined {
  return AURELLE_PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): ProductItem[] {
  return AURELLE_PRODUCTS.filter((p) => p.category_slug === categorySlug);
}
