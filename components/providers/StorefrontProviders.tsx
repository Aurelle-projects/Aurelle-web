"use client";

import React from "react";
import { CartProvider } from "@/context/CartContext";
import { WholesaleCartProvider } from "@/context/WholesaleCartContext";

export default function StorefrontProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <WholesaleCartProvider>
        {children}
      </WholesaleCartProvider>
    </CartProvider>
  );
}
