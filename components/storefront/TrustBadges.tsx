import React from "react";

// ─── Custom Line-Art Drawn Icons Matching Reference Design ───────────────────

function TruckDeliveryIcon({ className = "w-[19px] h-[19px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Van cargo box */}
      <path d="M1.5 4.5h12v10.5h-12z" />
      {/* Van cab */}
      <path d="M13.5 7.5h3.5l3.5 4v3.5h-7v-7.5z" />
      {/* Front cab window */}
      <path d="M14.5 8.5h2.2l2.3 2.8H14.5v-2.8z" />
      {/* Wheels with axle centers */}
      <circle cx="5.5" cy="17.5" r="2.3" />
      <circle cx="16.5" cy="17.5" r="2.3" />
      {/* Underbody links */}
      <path d="M7.8 17.5h6.4" />
      <path d="M18.8 17.5h1.7" />
      <path d="M1.5 15v2.5h1.7" />
    </svg>
  );
}

function AuthenticShieldIcon({ className = "w-[19px] h-[19px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Shield outline */}
      <path d="M12 2.5l7.5 3.2v5.8c0 5-3.3 9.4-7.5 10.8-4.2-1.4-7.5-5.8-7.5-10.8V5.7L12 2.5z" />
      {/* Inner checkmark badge */}
      <path d="M9 11.8l2.2 2.2 4.3-4.5" strokeWidth="1.9" />
    </svg>
  );
}

function SecureHexIcon({ className = "w-[19px] h-[19px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Geometric shield / secure emblem matching screenshot */}
      <path d="M12 2.5L4 6.2v5.5c0 4.8 3.4 9.2 8 10.3 4.6-1.1 8-5.5 8-10.3V6.2L12 2.5z" />
      {/* Center lock emblem */}
      <rect x="9" y="10.5" width="6" height="5" rx="1" />
      <path d="M10 10.5V8.5a2 2 0 114 0v2" />
    </svg>
  );
}

function SupportHeadsetIcon({ className = "w-[19px] h-[19px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Headband arch */}
      <path d="M3.5 13.5v-2.5a8.5 8.5 0 0117 0v2.5" />
      {/* Left earpad */}
      <rect x="2" y="13" width="3.2" height="5.5" rx="1.5" />
      {/* Right earpad */}
      <rect x="18.8" y="13" width="3.2" height="5.5" rx="1.5" />
      {/* Mic boom curve */}
      <path d="M20 17.5v.5a3 3 0 01-3 3h-3.5" />
      {/* Mic tip */}
      <circle cx="12.5" cy="21" r="0.8" fill="currentColor" />
    </svg>
  );
}

function ReturnsVanIcon({ className = "w-[19px] h-[19px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Return delivery van matching reference icon */}
      <path d="M1.5 4.5h12v10.5h-12z" />
      <path d="M13.5 7.5h3.5l3.5 4v3.5h-7v-7.5z" />
      <path d="M14.5 8.5h2.2l2.3 2.8H14.5v-2.8z" />
      <circle cx="5.5" cy="17.5" r="2.3" />
      <circle cx="16.5" cy="17.5" r="2.3" />
      <path d="M7.8 17.5h6.4" />
      <path d="M18.8 17.5h1.7" />
      <path d="M1.5 15v2.5h1.7" />
    </svg>
  );
}

const BADGES = [
  {
    icon: TruckDeliveryIcon,
    title: "UAE-Wide Delivery",
    subtitle: "Fast & Reliable",
  },
  {
    icon: AuthenticShieldIcon,
    title: "100% Authentic",
    subtitle: "Products",
  },
  {
    icon: SecureHexIcon,
    title: "Secure",
    subtitle: "Payments",
  },
  {
    icon: ReturnsVanIcon,
    title: "Easy & Hassle-Free",
    subtitle: "Returns",
  },
];

export default function TrustBadges() {
  return (
    <section
      className="bg-white py-6 sm:py-16"
      aria-label="Customer Guarantees"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: 2×2 centered stacked cells with dividers */}
        <div className="grid grid-cols-2 sm:hidden divide-x divide-y divide-[#E8E3DA]">
          {BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.title}
                className="flex flex-col items-center justify-center gap-2 py-5 px-3 text-center"
              >
                <div className="w-10 h-10 rounded-full border-[1.5px] border-[#1D211F] bg-transparent text-[#1D211F] flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#1D211F] leading-tight tracking-tight">
                    {badge.title}
                  </p>
                  <p className="text-[10.5px] text-[#5C6460] leading-tight mt-0.5">
                    {badge.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: horizontal icon+text row */}
        <div className="hidden sm:grid sm:grid-cols-4 gap-6 items-center justify-items-center">
          {BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.title}
                className="flex items-center gap-3 group cursor-default"
              >
                <div className="w-[40px] h-[40px] rounded-full border-[1.5px] border-[#1D211F] bg-transparent text-[#1D211F] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <Icon className="w-[19px] h-[19px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-[12.5px] font-bold text-[#1D211F] leading-tight tracking-tight">
                    {badge.title}
                  </p>
                  <p className="text-[11px] text-[#5C6460] leading-tight mt-0.5">
                    {badge.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
