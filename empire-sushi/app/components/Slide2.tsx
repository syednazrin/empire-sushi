'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense } from 'react';

function SushiModel() {
  const { scene } = useGLTF('/sushi.glb');
  return <primitive object={scene} scale={5} position={[0, -0.3, 0]} />;
}

export default function Slide2() {
  return (
    <section className="slide relative h-screen w-full bg-[var(--bg-cream)] overflow-hidden flex">
      <div className="h-full w-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center lg:items-stretch max-w-7xl mx-auto px-4 lg:px-6 py-3">
        {/* Left side: 3D Model - vertically centered in column, horizontal unchanged */}
        <div className="h-[38vh] lg:h-full min-h-[240px] relative flex items-center w-full">
          <div className="w-full h-full lg:h-[75vh] lg:max-h-full min-h-[280px] relative">
          <Canvas camera={{ position: [1.2, 2.2, 1.8], fov: 45 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <directionalLight position={[-10, -10, -5]} intensity={0.5} />
              <SushiModel />
              <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={2.5}
                maxDistance={6}
                autoRotate
                autoRotateSpeed={1.5}
              />
            </Suspense>
          </Canvas>
          </div>
        </div>

        {/* Right side: Assumptions - no white space below, content height only */}
        <div className="flex flex-col overflow-hidden self-start lg:self-center">
          <div className="flex-shrink-0 mb-2">
            <h2 className="font-serif text-2xl lg:text-3xl text-[#1a1a1a] tracking-tight">
              Our Assumptions
            </h2>
            <div className="w-12 h-0.5 bg-[var(--accent-coral)] rounded-full mt-1"></div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Assumption 1 */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col min-h-0">
              <h3 className="font-serif text-sm font-semibold text-[#1a1a1a] mb-1.5 flex items-center gap-2 flex-shrink-0">
                <span className="w-5 h-5 bg-[var(--accent-coral)] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                Peer Set Definition
              </h3>
              <p className="text-gray-700 text-[11px] leading-snug pl-7 flex-1 min-h-0 overflow-hidden line-clamp-4">
                The brands included in this analysis are limited to operators offering relatively affordable,
                mass-market sushi or a grab-and-go format. Premium or high-end sushi chains are intentionally
                excluded to ensure comparability with Empire Sushi's operating model, target customer base,
                and price positioning.
              </p>
            </div>

            {/* Assumption 2 */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col min-h-0">
              <h3 className="font-serif text-sm font-semibold text-[#1a1a1a] mb-1.5 flex items-center gap-2 flex-shrink-0">
                <span className="w-5 h-5 bg-[var(--accent-coral)] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                Menu Scope Standardisation
              </h3>
              <p className="text-gray-700 text-[11px] leading-snug pl-7 flex-1 min-h-0 overflow-hidden line-clamp-4">
                For consistency and comparability, the analysis is restricted strictly to sushi items.
                Non-sushi menu offerings (e.g. ramen, rice bowls, side dishes, beverages) are excluded
                to avoid distortion in pricing and product mix comparisons.
              </p>
            </div>

            {/* Assumption 3 */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col min-h-0">
              <h3 className="font-serif text-sm font-semibold text-[#1a1a1a] mb-1.5 flex items-center gap-2 flex-shrink-0">
                <span className="w-5 h-5 bg-[var(--accent-coral)] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                Google Search Interest Data
              </h3>
              <p className="text-gray-700 text-[11px] leading-snug pl-7 flex-1 min-h-0 overflow-hidden line-clamp-4">
                Brand interest trends are derived from Google search data sampled on a weekly basis
                from 2 February 2025 to 25 January 2026. This period is assumed to be representative
                of recent consumer interest dynamics and is used as a relative indicator of brand
                awareness and demand trends, rather than absolute sales performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
