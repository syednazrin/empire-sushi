'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense } from 'react';

function SushiModel() {
  const { scene } = useGLTF('/sushi.glb');
  return <primitive object={scene} scale={2.5} position={[0, -1, 0]} />;
}

export default function Slide2() {
  return (
    <section className="slide relative min-h-screen w-full bg-[var(--bg-cream)] overflow-hidden flex items-center justify-center">
      <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side: 3D Model */}
        <div className="h-[500px] lg:h-[600px] relative">
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <directionalLight position={[-10, -10, -5]} intensity={0.5} />
              <SushiModel />
              <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={3}
                maxDistance={8}
                autoRotate
                autoRotateSpeed={1.5}
              />
            </Suspense>
          </Canvas>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full">
            Drag to rotate • Scroll to zoom
          </div>
        </div>

        {/* Right side: Assumptions */}
        <div className="space-y-8">
          <div>
            <h2 className="font-serif text-4xl lg:text-5xl text-[#1a1a1a] tracking-tight mb-2">
              Our Assumptions
            </h2>
            <div className="w-16 h-1 bg-[var(--accent-coral)] rounded-full"></div>
          </div>

          <div className="space-y-6">
            {/* Assumption 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-serif text-xl text-[#1a1a1a] mb-3 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-[var(--accent-coral)] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                Peer Set Definition
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed pl-11">
                The brands included in this analysis are limited to operators offering relatively affordable, 
                mass-market sushi or a grab-and-go format. Premium or high-end sushi chains are intentionally 
                excluded to ensure comparability with Empire Sushi's operating model, target customer base, 
                and price positioning.
              </p>
            </div>

            {/* Assumption 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-serif text-xl text-[#1a1a1a] mb-3 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-[var(--accent-coral)] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                Menu Scope Standardisation
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed pl-11">
                For consistency and comparability, the analysis is restricted strictly to sushi items. 
                Non-sushi menu offerings (e.g. ramen, rice bowls, side dishes, beverages) are excluded 
                to avoid distortion in pricing and product mix comparisons.
              </p>
            </div>

            {/* Assumption 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="font-serif text-xl text-[#1a1a1a] mb-3 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-[var(--accent-coral)] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                Google Search Interest Data
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed pl-11">
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
