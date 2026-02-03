"use client";

import { useState, useCallback, useEffect } from "react";
import { Slide1Cover } from "./components/Slide1Cover";
import { MapSlide } from "./components/MapSlide";
import { Slide3Trends } from "./components/Slide3Trends";
import { PageCounter } from "./components/PageCounter";

function useActiveSlide() {
  const [active, setActive] = useState(1);

  const onScroll = useCallback(() => {
    const slides = document.querySelectorAll(".slide");
    const vh = window.innerHeight;
    const scrollY = window.scrollY;
    let index = 1;
    for (let i = 0; i < slides.length; i++) {
      const el = slides[i] as HTMLElement;
      const top = el.offsetTop;
      if (scrollY >= top - vh * 0.3) index = i + 1;
    }
    setActive(index);
  }, []);

  useEffect(() => {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return active;
}

export default function Home() {
  const activeSlide = useActiveSlide();

  return (
    <>
      <main className="relative">
        <Slide1Cover isActive={activeSlide === 1} />
        <MapSlide isActive={activeSlide === 2} />
        <Slide3Trends isActive={activeSlide === 3} />
      </main>
      <PageCounter currentSlide={activeSlide} />
    </>
  );
}
