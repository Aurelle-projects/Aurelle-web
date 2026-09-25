"use client";

import React, { useState, useEffect, useRef } from "react";
import { Phone, MessageCircle, X, Headphones } from "lucide-react";

interface WholesaleFloatingContactProps {
  phone?: string;
  whatsappUrl?: string;
}

export default function WholesaleFloatingContact({
  phone = "+971 50 123 4567",
  whatsappUrl = "https://wa.me/971501234567",
}: WholesaleFloatingContactProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const cleanPhone = phone.replace(/\s+/g, "");

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50 pointer-events-none select-none"
    >
      <div className="relative">
        {/* Floating Options (Opens Above Main Button) */}
        <div
          className={`absolute bottom-full right-0 mb-3 flex flex-col items-end gap-3 transition-all duration-300 ease-out origin-bottom-right ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto visible"
              : "opacity-0 scale-90 translate-y-2 pointer-events-none invisible"
          }`}
        >
          {/* WhatsApp Option */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="group flex items-center gap-3 active:scale-95 transition-transform pointer-events-auto"
          >
            <span className="px-3 py-1.5 bg-white text-[#14231B] text-xs font-semibold rounded-full shadow-md border border-[#EFEAE0] whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
              WhatsApp Trade Desk
            </span>
            <div className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105">
              <MessageCircle size={22} className="fill-current" />
            </div>
          </a>

          {/* Direct Phone Call Option */}
          <a
            href={`tel:${cleanPhone}`}
            aria-label={`Call us at ${phone}`}
            className="group flex items-center gap-3 active:scale-95 transition-transform pointer-events-auto"
          >
            <span className="px-3 py-1.5 bg-white text-[#14231B] text-xs font-semibold rounded-full shadow-md border border-[#EFEAE0] whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
              Call: {phone}
            </span>
            <div className="w-12 h-12 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105">
              <Phone size={20} className="fill-current" />
            </div>
          </a>
        </div>

        {/* Main Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label="Contact wholesale support"
          className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer active:scale-95 ${
            isOpen
              ? "bg-[#14231B] text-white rotate-90"
              : "bg-[#183D2B] hover:bg-[#102D20] text-white hover:scale-105"
          }`}
        >
          {isOpen ? (
            <X size={24} className="transition-transform duration-200" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Headphones size={24} />
              {/* Subtle pulsing indicator ring */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
