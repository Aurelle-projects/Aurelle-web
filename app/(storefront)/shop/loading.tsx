import React from "react";

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 md:py-12 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="h-8 w-48 bg-[#E9E4DC] rounded-none" />
        <div className="h-10 w-full bg-[#E9E4DC] rounded-none" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] bg-[#E9E4DC] rounded-none" />
              <div className="h-4 w-3/4 bg-[#E9E4DC] rounded-none" />
              <div className="h-4 w-1/3 bg-[#E9E4DC] rounded-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
