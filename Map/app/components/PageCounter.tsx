"use client";

const TOTAL_SLIDES = 3;

export function PageCounter({ currentSlide }: { currentSlide: number }) {
  const slide = Math.min(Math.max(1, currentSlide), TOTAL_SLIDES);
  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 select-none text-sm font-medium text-black/40"
      aria-live="polite"
    >
      {String(slide).padStart(2, "0")} / {String(TOTAL_SLIDES).padStart(2, "0")}
    </div>
  );
}
