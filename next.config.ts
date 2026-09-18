import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // ─── Image Optimization ─────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [375, 430, 768, 1024, 1280, 1440, 1920],
    imageSizes: [150, 300, 400, 600, 800],
    minimumCacheTTL: 3600,
  },

  // ─── Security Headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      // Raw body for Stripe webhooks — do NOT parse as JSON
      {
        source: "/api/webhooks/stripe",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },

  // ─── Redirects ───────────────────────────────────────────────────────────────
  async redirects() {
    return [];
  },

  // ─── Experimental ────────────────────────────────────────────────────────────
  experimental: {
    // Opt into React 19 compiler if desired later
  },
};

export default nextConfig;
