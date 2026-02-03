'use client';

export default function Slide1() {
  const scrollToNext = () => {
    const slides = document.querySelectorAll('.slide');
    if (slides[1]) (slides[1] as HTMLElement).scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="slide relative min-h-screen w-full flex overflow-hidden bg-[var(--bg-peach)]">
      {/* Soft decorative sushi pattern – low opacity background */}
      <div
        className="absolute inset-0 pointer-events-none select-none opacity-[0.06]"
        aria-hidden
      >
        <div className="absolute inset-0 flex flex-wrap gap-16 p-16 content-start justify-around">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="text-4xl md:text-5xl"
              style={{ transform: `rotate(${(i * 15) % 360}deg)` }}
            >
              🍣
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-center min-h-screen py-16 lg:py-24">
        <h1 className="font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-[#1a1a1a] leading-[1.1] tracking-tight animate-fade-slide-up opacity-0 [animation-fill-mode:forwards] slide-in-delay-1 drop-shadow-sm">
          Beyond the Menu: Evaluating Growth Viability in Quick-Service Sushi
        </h1>
        <p className="mt-6 text-xl lg:text-2xl font-light text-[#4a4a4a] max-w-xl animate-fade-slide-up opacity-0 [animation-fill-mode:forwards] slide-in-delay-2 drop-shadow-sm">
          A data-driven, investor-facing analysis of Empire Sushi and its market
        </p>
        <p className="mt-6 text-base lg:text-lg text-[#5a5a5a] font-light leading-relaxed max-w-lg animate-fade-slide-up opacity-0 [animation-fill-mode:forwards] slide-in-delay-3 drop-shadow-sm">
          Strategic insights on positioning, competition, and growth potential in the premium quick-service sushi segment.
        </p>
        <div className="mt-10 animate-fade-slide-up opacity-0 [animation-fill-mode:forwards] slide-in-delay-4">
          <button
            type="button"
            onClick={scrollToNext}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent-coral)] text-white text-sm font-medium tracking-wide shadow-md hover:bg-[var(--accent-coral-soft)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral)] focus:ring-offset-2 focus:ring-offset-[var(--bg-peach)]"
          >
            Scroll to Explore
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
