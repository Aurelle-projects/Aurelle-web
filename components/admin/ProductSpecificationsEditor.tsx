"use client";

import React from "react";
import { Plus, Trash2, Sliders, Sparkles } from "lucide-react";

export interface SpecPair {
  key: string;
  value: string;
}

interface ProductSpecificationsEditorProps {
  specifications: SpecPair[];
  onChange: (specifications: SpecPair[]) => void;
}

const COMMON_SPEC_SUGGESTIONS = [
  "Size / Volume",
  "Skin Type",
  "Country of Origin",
  "Texture",
  "Finish",
  "Key Ingredients",
  "Target Concerns",
  "Sun Protection",
  "Coverage",
  "Cruelty-Free",
];

export default function ProductSpecificationsEditor({
  specifications,
  onChange,
}: ProductSpecificationsEditorProps) {
  function handleAddRow(initialKey = "") {
    onChange([...specifications, { key: initialKey, value: "" }]);
  }

  function handleRemoveRow(index: number) {
    onChange(specifications.filter((_, i) => i !== index));
  }

  function handleUpdateRow(index: number, field: "key" | "value", val: string) {
    onChange(
      specifications.map((row, i) =>
        i === index ? { ...row, [field]: val } : row
      )
    );
  }

  const existingKeys = new Set(
    specifications.map((s) => s.key.trim().toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCCFB9]/30 pb-3">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-[#183D2B]" />
          <div>
            <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider">
              Product Specifications (Key-Value Pairs)
            </h2>
            <p className="text-xs text-[#5C6460]">
              These attributes appear directly in the Product Specifications accordion on the storefront.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleAddRow()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#183D2B] bg-[#183D2B]/5 hover:bg-[#183D2B]/10 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Add Attribute</span>
        </button>
      </div>

      {/* Quick Suggestion Pills */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={12} className="text-[#8E9590]" />
          <span className="text-[11px] font-bold text-[#8E9590] uppercase tracking-wider">
            Quick Add Suggestions
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_SPEC_SUGGESTIONS.map((suggestion) => {
            const alreadyAdded = existingKeys.has(suggestion.toLowerCase());
            return (
              <button
                key={suggestion}
                type="button"
                disabled={alreadyAdded}
                onClick={() => handleAddRow(suggestion)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  alreadyAdded
                    ? "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
                    : "bg-[#FAF8F5] border-[#DCCFB9] text-[#1D211F] hover:bg-[#183D2B] hover:text-white hover:border-[#183D2B]"
                }`}
              >
                + {suggestion}
              </button>
            );
          })}
        </div>
      </div>

      {/* Specifications Rows */}
      {specifications.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-[#DCCFB9]/60 rounded-lg bg-[#FAF8F5]/40 space-y-2">
          <p className="text-xs font-semibold text-[#1D211F]">
            No specifications added yet
          </p>
          <p className="text-xs text-[#8E9590] max-w-md mx-auto">
            Click any suggestion above or click &ldquo;Add Attribute&rdquo; to add custom specifications like Size, Skin Type, or Country of Origin.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-[11px] font-bold uppercase tracking-wider text-[#8E9590] px-1">
            <span className="sm:col-span-5">Attribute Name / Key</span>
            <span className="sm:col-span-6">Value</span>
            <span className="sm:col-span-1 text-center">Action</span>
          </div>

          {specifications.map((spec, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 sm:p-2 bg-[#FAF8F5]/70 border border-[#DCCFB9]/50 rounded-lg transition-colors hover:border-[#183D2B]/30"
            >
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => handleUpdateRow(idx, "key", e.target.value)}
                  placeholder="e.g. Size / Volume"
                  className="w-full h-9 px-3 bg-white border border-[#DCCFB9] rounded-md text-xs font-semibold text-[#1D211F] focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/20 outline-none transition-all"
                />
              </div>
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => handleUpdateRow(idx, "value", e.target.value)}
                  placeholder="e.g. 50 ml / 1.7 fl oz"
                  className="w-full h-9 px-3 bg-white border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/20 outline-none transition-all"
                />
              </div>
              <div className="sm:col-span-1 flex justify-end sm:justify-center">
                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove specification"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleAddRow()}
              className="w-full py-2.5 border border-dashed border-[#DCCFB9] hover:border-[#183D2B] text-xs font-semibold text-[#5C6460] hover:text-[#183D2B] rounded-lg bg-[#FAF8F5]/30 hover:bg-[#FAF8F5] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Another Specification Row</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
