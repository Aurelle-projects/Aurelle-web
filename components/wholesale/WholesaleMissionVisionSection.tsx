import React from "react";
import { Compass, Eye } from "lucide-react";

export interface WholesaleMissionVisionData {
  mission_heading?: string;
  mission_description?: string;
  vision_heading?: string;
  vision_description?: string;
}

interface WholesaleMissionVisionSectionProps {
  data?: WholesaleMissionVisionData;
}

export default function WholesaleMissionVisionSection({
  data,
}: WholesaleMissionVisionSectionProps) {
  const hasMission = Boolean(
    data?.mission_heading?.trim() || data?.mission_description?.trim()
  );
  const hasVision = Boolean(
    data?.vision_heading?.trim() || data?.vision_description?.trim()
  );

  // If no mission and no vision data is provided, do not render mock data
  if (!hasMission && !hasVision) {
    return null;
  }

  return (
    <section
      className="bg-[#FAF8F5] py-8 md:py-12 border-b border-[#EFEAE0]"
      aria-label="Wholesale Mission and Vision"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 ${
            hasMission && hasVision ? "md:grid-cols-2" : "max-w-2xl mx-auto"
          } gap-6 items-stretch`}
        >
          {/* Mission Card */}
          {hasMission && (
            <div className="bg-white p-5 sm:p-6 rounded-sm border border-[#DCCFB9]/60 shadow-xs space-y-3 hover:border-[#183D2B]/40 transition-colors">
              {/* Icon and Heading on the same line */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-[#183D2B]/10 flex items-center justify-center text-[#183D2B] shrink-0">
                  <Compass size={17} />
                </div>

                {data?.mission_heading && (
                  <h3 className="text-lg sm:text-xl text-[#14231B] tracking-tight">
                    {data.mission_heading}
                  </h3>
                )}
              </div>

              {/* Description */}
              {data?.mission_description && (
                <p className="text-xs sm:text-sm text-[#5C6460] leading-relaxed whitespace-pre-line">
                  {data.mission_description}
                </p>
              )}
            </div>
          )}

          {/* Vision Card */}
          {hasVision && (
            <div className="bg-white p-5 sm:p-6 rounded-sm border border-[#DCCFB9]/60 shadow-xs space-y-3 hover:border-[#183D2B]/40 transition-colors">
              {/* Icon and Heading on the same line */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-[#183D2B]/10 flex items-center justify-center text-[#183D2B] shrink-0">
                  <Eye size={17} />
                </div>

                {data?.vision_heading && (
                  <h3 className="text-lg sm:text-xl text-[#14231B] tracking-tight">
                    {data.vision_heading}
                  </h3>
                )}
              </div>

              {/* Description */}
              {data?.vision_description && (
                <p className="text-xs sm:text-sm text-[#5C6460] leading-relaxed whitespace-pre-line">
                  {data.vision_description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
