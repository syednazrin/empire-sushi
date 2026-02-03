export function Slide1Cover({ isActive = true }: { isActive?: boolean }) {
  return (
    <section
      className={`slide relative flex min-h-screen w-full flex-col md:flex-row ${!isActive ? "slide-inactive" : ""}`}
    >
      {/* Decorative vertical Japanese text — low opacity */}
      <div
        className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 select-none text-[10rem] font-[400] leading-none text-black/[0.04] md:block"
        style={{ writingMode: "vertical-rl", fontFamily: "var(--font-serif-jp), serif" }}
        aria-hidden
      >
        寿司
      </div>

      {/* Left: content */}
      <div className="flex flex-1 flex-col justify-center px-8 py-16 md:px-16 lg:px-24">
        <h1
          className="font-serif text-5xl font-semibold tracking-tight text-[#171717] md:text-6xl lg:text-7xl"
          style={{ fontFamily: "var(--font-serif-jp), Georgia, serif" }}
        >
          Empire Sushi
        </h1>
        <p
          className="mt-4 text-xl font-medium text-[#171717]/80 md:text-2xl"
          style={{ fontFamily: "var(--font-serif-jp), Georgia, serif" }}
        >
          A Competitive Landscape & Location Intelligence Study
        </p>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-[#171717]/70 md:text-lg">
          This study evaluates Empire Sushi&apos;s positioning against key competitors using
          pricing, menu depth, and spatial distribution analytics.
        </p>
        <div className="mt-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#171717]/15 bg-[#fafafa] px-5 py-2.5 text-sm font-medium text-[#171717]/80">
            Scroll to Explore
          </span>
        </div>
      </div>

      {/* Right: image placeholder — soft edge */}
      <div className="relative h-64 flex-1 md:h-auto md:min-h-screen md:max-w-[50%]">
        <div
          className="absolute inset-0 bg-[#f5d5cf]/40 md:rounded-l-[3rem]"
          style={{
            maskImage: "linear-gradient(to left, black 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, black 60%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#e8a598]/20 to-[#f5d5cf]/30 md:rounded-l-[3rem]"
          style={{
            maskImage: "linear-gradient(to left, black 70%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, black 70%, transparent 100%)",
          }}
        />
      </div>
    </section>
  );
}
