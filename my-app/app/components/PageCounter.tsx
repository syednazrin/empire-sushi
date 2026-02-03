'use client';

import { useEffect, useState } from 'react';

export default function PageCounter({ totalSlides }: { totalSlides: number }) {
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Array.from(slides).indexOf(entry.target);
          if (index >= 0) setCurrent(index + 1);
        });
      },
      { threshold: 0.5, rootMargin: '0px' }
    );

    slides.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [totalSlides]);

  return (
    <div
      className="fixed bottom-6 right-6 z-40 select-none pointer-events-none text-sm font-medium tabular-nums"
      style={{ color: 'rgba(80, 80, 80, 0.75)' }}
      aria-label={`Page ${current} of ${totalSlides}`}
    >
      {String(current).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
    </div>
  );
}
