import React, { Suspense } from "react";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { AnimatedHeroPlayer } from "../components/ui/animated-hero-player";

function LoadingFallback() {
  return (
    <div className="w-full aspect-video bg-slate-900 flex items-center justify-center">
      <span className="text-white text-lg">Loading animation...</span>
    </div>
  );
}

export function HeroAnimationDemoPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-white">
      <Navigation />

      <main className="flex-1">
        {/* Hero Animation Section */}
        <section className="relative w-full pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Spatial Push Animation Demo
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Premium animated hero using Remotion with smooth spatial push transitions.
                Watch as scenes transition with spring physics and scaling effects.
              </p>
            </div>

            {/* Animation Player */}
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <Suspense fallback={<LoadingFallback />}>
                <AnimatedHeroPlayer
                  autoPlay
                  loop
                  controls={false}
                  className="border border-gray-200"
                />
              </Suspense>
            </div>

            {/* Features Section */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 mb-4">
                  <span className="text-orange-600 font-bold">✨</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Smooth Transitions</h3>
                <p className="text-gray-600">
                  Spring physics create natural, fluid motion between scenes.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 mb-4">
                  <span className="text-orange-600 font-bold">🎬</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Animation</h3>
                <p className="text-gray-600">
                  Professional-grade video composition with Remotion.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 mb-4">
                  <span className="text-orange-600 font-bold">⚡</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">High Performance</h3>
                <p className="text-gray-600">
                  Optimized rendering with 60fps capability and GPU acceleration.
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-16 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">Component Usage</h2>
              <p className="text-blue-800 mb-4">
                The <code className="bg-blue-100 px-2 py-1 rounded">AnimatedHeroPlayer</code> component
                is ready to be integrated into your hero sections, landing pages, and showcase areas.
              </p>
              <ul className="text-blue-800 space-y-2">
                <li>✓ Fully responsive and mobile-optimized</li>
                <li>✓ Customizable animation direction and duration</li>
                <li>✓ Auto-play and loop controls</li>
                <li>✓ Compatible with shadcn/ui design system</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
