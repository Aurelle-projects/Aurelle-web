import React from "react";

export default function ProductDetailLoading() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen py-8 md:py-12 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 w-48 bg-[#E9E4DC] rounded-none" />

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Gallery Skeleton */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            <div className="hidden md:flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-20 h-24 bg-[#E9E4DC] rounded-none" />
              ))}
            </div>
            <div className="flex-1 aspect-[3/4] bg-[#E9E4DC] rounded-none border border-[#DCCFB9]/40" />
          </div>

          {/* Buy Box Skeleton */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="h-3 w-24 bg-[#E9E4DC] rounded-none" />
              <div className="h-8 w-4/5 bg-[#E9E4DC] rounded-none" />
              <div className="h-4 w-32 bg-[#E9E4DC] rounded-none" />
            </div>

            <div className="py-4 border-y border-[#DCCFB9]/40 space-y-2">
              <div className="h-8 w-36 bg-[#E9E4DC] rounded-none" />
              <div className="h-3 w-56 bg-[#E9E4DC] rounded-none" />
            </div>

            <div className="space-y-2">
              <div className="h-3 w-full bg-[#E9E4DC] rounded-none" />
              <div className="h-3 w-5/6 bg-[#E9E4DC] rounded-none" />
              <div className="h-3 w-4/6 bg-[#E9E4DC] rounded-none" />
            </div>

            <div className="space-y-3 pt-4">
              <div className="h-11 w-full bg-[#183D2B]/15 rounded-none" />
              <div className="h-11 w-full bg-[#E9E4DC] rounded-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
