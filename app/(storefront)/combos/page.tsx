import type { Metadata } from "next";
import CombosListingClient from "./CombosListingClient";

export const metadata: Metadata = {
  title: "Combo Offers | Aurelle Cosmetics",
  description:
    "Discover thoughtfully curated beauty and skincare combinations with exclusive savings from Aurelle Cosmetics.",
  alternates: { canonical: "/combos" },
};

export default function CombosPage() {
  return <CombosListingClient />;
}
