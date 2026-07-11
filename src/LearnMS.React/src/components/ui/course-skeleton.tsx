import React from "react";
import { useTranslation } from "react-i18next";

// Shimmer animation styles
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .skeleton {
    position: relative;
    overflow: hidden;
    background: hsl(var(--muted));
  }

  .skeleton::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      hsl(var(--background) / 0.8),
      transparent
    );
    transform: translateX(-100%);
    animation: shimmer 1.5s ease-in-out infinite;
  }
`;

// Inject styles once
let stylesInjected = false;
if (typeof document !== "undefined" && !stylesInjected) {
  const styleElement = document.createElement("style");
  styleElement.textContent = shimmerStyles;
  document.head.appendChild(styleElement);
  stylesInjected = true;
}

// Reusable skeleton component
const SkeletonBox: React.FC<{
  className?: string;
  width?: string;
  height?: string;
}> = ({ className = "", width, height }) => (
  <div className={`skeleton rounded ${className}`} style={{ width, height }} />
);

const CourseCardSkeleton: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      className="w-full max-w-sm mx-auto border rounded-xl sm:max-w-none bg-card"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex flex-col h-full">
        {/* Image skeleton */}
        <SkeletonBox className="w-full h-40 rounded-t-xl sm:h-48" />

        <div className="flex flex-col flex-1 p-4 space-y-4">
          {/* Title skeletons */}
          <div className="space-y-2">
            <SkeletonBox className="w-full h-6" />
            <SkeletonBox className="w-3/4 h-6" />
          </div>

          {/* Description skeletons */}
          <div className="space-y-2">
            <SkeletonBox className="w-full h-4" />
            <SkeletonBox className="w-5/6 h-4" />
          </div>

          {/* Info items */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonBox className="w-6 h-6 rounded-full" />
              <SkeletonBox className="w-20 h-4" />
            </div>
            <div className="flex items-center gap-3">
              <SkeletonBox className="w-6 h-6 rounded-full" />
              <SkeletonBox className="w-24 h-4" />
            </div>
          </div>

          {/* Button skeleton */}
          <SkeletonBox className="w-full h-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

const CoursesGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      className="grid w-full grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {Array.from({ length: count }).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  );
};

const CourseAccordionSkeleton: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <div className="relative z-10 w-full px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-16 lg:py-20">
        <div className="relative z-10 w-full space-y-12 sm:space-y-16 lg:space-y-20">
          {/* Section title skeleton */}
          <div className="mb-8 space-y-4 text-center sm:mb-12 lg:mb-16">
            <SkeletonBox className="w-48 h-8 mx-auto sm:w-64 sm:h-10 lg:h-12" />
            <SkeletonBox className="h-5 max-w-2xl mx-auto w-96 sm:h-6" />
          </div>

          {/* Accordion Items Skeleton */}
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="w-full transition-all duration-200 border rounded-lg shadow-lg bg-card border-border/20 hover:border-border/40 hover:shadow-xl"
              >
                {/* Accordion Header */}
                <div className="flex gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6 lg:p-8">
                  {/* Image Section */}
                  <div className="flex-shrink-0">
                    <SkeletonBox className="w-16 h-16 rounded-lg sm:w-24 sm:h-24 lg:w-28 lg:h-28 sm:rounded-xl" />
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                    {/* Mobile Layout: Title and Badge */}
                    <div className="flex flex-col gap-3 sm:hidden">
                      <SkeletonBox className="w-full h-5" />
                      <SkeletonBox className="w-20 h-6 rounded-full" />
                    </div>

                    {/* Desktop Layout: Title Section */}
                    <div className="hidden sm:block">
                      <SkeletonBox className="w-3/4 h-6 sm:h-7 lg:h-8 xl:h-9" />
                    </div>

                    {/* Stats and Price Row */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      {/* Statistics */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <SkeletonBox className="w-3 h-3 rounded-full sm:w-4 sm:h-4" />
                          <SkeletonBox className="w-16 h-4" />
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <SkeletonBox className="w-3 h-3 rounded-full sm:w-4 sm:h-4" />
                          <SkeletonBox className="w-12 h-4" />
                        </div>
                      </div>

                      {/* Badge for desktop */}
                      <div className="hidden sm:flex sm:items-center sm:justify-end sm:flex-shrink-0">
                        <SkeletonBox className="w-20 h-6 rounded-full" />
                      </div>

                      {/* Price Info */}
                      <div className="flex flex-col items-start gap-1 mt-1 sm:mt-0 sm:items-end">
                        <SkeletonBox className="w-20 h-5" />
                        <SkeletonBox className="w-16 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CourseHeaderSkeleton: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div className="py-8 bg-background sm:py-12" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container px-4 py-6 mx-auto sm:px-6 sm:py-8">
        <div className="grid items-start grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Image Section */}
          <div className="order-first lg:order-last lg:col-span-4">
            <div className="w-full max-w-sm mx-auto overflow-hidden border rounded-2xl lg:max-w-none bg-card">
              <SkeletonBox className="w-full h-48 sm:h-56 lg:h-64" />
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-6 lg:col-span-8">
            {/* Badges */}
            <div className="flex gap-2">
              <SkeletonBox className="w-16 h-6 rounded-full" />
              <SkeletonBox className="w-20 h-6 rounded-full" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <SkeletonBox className="w-3/4 h-8" />
              <SkeletonBox className="w-1/2 h-8" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <SkeletonBox className="w-full h-5" />
              <SkeletonBox className="w-4/5 h-5" />
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 space-y-2 rounded-lg bg-card">
                  <SkeletonBox className="w-20 h-4" />
                  <SkeletonBox className="w-24 h-6" />
                </div>
              ))}
            </div>

            {/* Button */}
            <SkeletonBox className="w-40 h-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export {
  CourseCardSkeleton,
  CoursesGridSkeleton,
  CourseAccordionSkeleton,
  CourseHeaderSkeleton,
};
