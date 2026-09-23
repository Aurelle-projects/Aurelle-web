"use client";

import React, { useEffect } from "react";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  itemType?: string; // e.g., "product", "category", "subcategory", "brand", "review", "image"
  imagePreview?: string;
  description?: string;
  warningNote?: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = "item",
  imagePreview,
  description,
  warningNote,
  isLoading = false,
  confirmText = "Delete",
  cancelText = "Cancel",
}: DeleteConfirmModalProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const defaultTitle = `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
  const defaultDesc = itemName
    ? `Are you sure you want to permanently delete "${itemName}"?`
    : `Are you sure you want to delete this ${itemType.toLowerCase()}?`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#183D2B]/10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <X size={18} />
        </button>

        <div className="p-6 space-y-4">
          {/* Icon and Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0 shadow-xs">
              <Trash2 size={22} className="stroke-[2.2]" />
            </div>
            <div className="flex-1 pr-6">
              <h3 className="text-lg font-bold text-[#1A1A1A]">
                {title || defaultTitle}
              </h3>
              <p className="text-sm text-[#5C6460] mt-1 leading-relaxed">
                {description || defaultDesc}
              </p>
            </div>
          </div>

          {/* Image Thumbnail Preview (if provided) */}
          {imagePreview && (
            <div className="flex items-center justify-center p-3 rounded-xl bg-[#FAF8F5] border border-[#183D2B]/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt={itemName || "Item to delete"}
                className="w-24 h-24 object-cover rounded-lg border border-[#DCCFB9]/50 shadow-xs"
              />
            </div>
          )}

          {/* Item Name Highlight Badge (if provided) */}
          {itemName && (
            <div className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#183D2B]/10 flex items-center justify-between text-xs">
              <span className="text-[#5C6460] font-medium capitalize">{itemType}:</span>
              <span className="font-semibold text-[#1A1A1A] truncate max-w-[240px]">
                {itemName}
              </span>
            </div>
          )}

          {/* Optional Warning Note */}
          {warningNote && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>{warningNote}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#183D2B]/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#5C6460] hover:bg-gray-100 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
