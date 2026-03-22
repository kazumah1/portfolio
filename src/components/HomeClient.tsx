"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { EdgeNav } from "@/components/EdgeNav";
import { Header } from "@/components/Header";
import { useTransitionProvider } from "@/components/TransitionProvider";
import { sectionPageOrder, sectionPages } from "@/content/sections";
import type { SectionId } from "@/content/siteContent";
import { usePrefersReducedMotion, useScrollActivity } from "@/lib/hooks";
import { useUIStore } from "@/lib/store";
import { BrainScene } from "@/three/BrainScene";
import { preloadBrainSharedData } from "@/three/brainShared";

export const HomeClient = (): JSX.Element => {
  const router = useRouter();
  const navigationTimeoutRef = useRef<number | null>(null);
  const prefetchedRoutesRef = useRef<Set<SectionId>>(new Set());
  const [navigatingSectionId, setNavigatingSectionId] = useState<SectionId | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const hoveredSectionId = useUIStore((state) => state.hoveredSectionId);
  const setHover = useUIStore((state) => state.setHover);
  const setPrefersReducedMotion = useUIStore((state) => state.setPrefersReducedMotion);
  const setScrolling = useUIStore((state) => state.setScrolling);

  const prefersReducedMotion = usePrefersReducedMotion();
  const isScrolling = useScrollActivity(250);
  const { isTransitioning, startSectionTransition } = useTransitionProvider();

  useEffect(() => {
    setPrefersReducedMotion(prefersReducedMotion);
  }, [prefersReducedMotion, setPrefersReducedMotion]);

  useLayoutEffect(() => {
    setHover(null);
    setNavigatingSectionId(null);
  }, [setHover]);

  useEffect(() => {
    setScrolling(isScrolling);
  }, [isScrolling, setScrolling]);

  useEffect(() => {
    const mobileMedia = window.matchMedia("(max-width: 767px)");

    const update = () => {
      setIsMobileViewport(mobileMedia.matches);
    };

    update();
    mobileMedia.addEventListener("change", update);

    return () => {
      mobileMedia.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    void preloadBrainSharedData();
    sectionPageOrder.forEach((sectionId) => {
      router.prefetch(`/${sectionId}`);
      prefetchedRoutesRef.current.add(sectionId);
    });
  }, [router]);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const handleSectionSelect = (sectionId: SectionId) => {
    if (navigatingSectionId) {
      return;
    }

    startSectionTransition(sectionId);
    setHover(sectionId);
    setNavigatingSectionId(sectionId);
    void preloadBrainSharedData();

    navigationTimeoutRef.current = window.setTimeout(() => {
      router.push(`/${sectionId}`);
    }, 70);
  };

  const handleHover = (sectionId: SectionId | null) => {
    setHover(sectionId);
    if (!sectionId || prefetchedRoutesRef.current.has(sectionId)) {
      return;
    }
    prefetchedRoutesRef.current.add(sectionId);
    router.prefetch(`/${sectionId}`);
  };

  const isMobileInteractionMode = isMobileViewport;

  if (isMobileViewport) {
    return (
      <main className="relative min-h-screen w-screen overflow-x-hidden bg-bg text-fg">
        <div
          className={`transition-opacity duration-120 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <Header />

          <section className="relative z-20 mx-auto flex w-full max-w-[640px] flex-col items-center px-6 pb-10 pt-[5.7rem]">
            <div className="w-full max-w-[78vw] overflow-hidden [touch-action:pan-y] sm:max-w-[520px]">
              <div className="mx-auto h-[32vh] min-h-[200px] max-h-[36vh] w-full max-w-[520px]">
                <BrainScene
                  navigationSectionId={navigatingSectionId}
                  mobileMode={isMobileInteractionMode}
                />
              </div>
            </div>

            <p className="mt-2 max-w-[360px] whitespace-nowrap text-center text-[0.73rem] tracking-[0.01em] text-fg/48">
              Systems interfaces for high-stakes decisions.
            </p>

            <nav aria-label="Primary sections" className="mt-4 w-full max-w-[360px]">
              <ul>
                {sectionPageOrder.map((sectionId, index) => (
                  <li key={sectionId} className="border-b border-fg/10 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => handleSectionSelect(sectionId)}
                      className="group flex w-full items-center justify-between py-3.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/70"
                    >
                      <span className="text-[1.02rem] font-medium tracking-[-0.015em] text-fg/82 transition-colors duration-150 group-active:text-accent">
                        {sectionPages[sectionId].title}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-fg/36 transition-colors duration-150 group-active:text-accent/72">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          aria-hidden="true"
                          className="font-mono text-[0.7rem] text-fg/34 transition-all duration-150 group-active:translate-x-0.5 group-active:text-accent/80"
                        >
                          &rarr;
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-bg text-fg">
      <div
        className={`absolute inset-0 transition-opacity duration-100 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <BrainScene
          navigationSectionId={navigatingSectionId}
          mobileMode={isMobileInteractionMode}
        />
      </div>

      <div>
        <Header />

        <EdgeNav
          hoveredSectionId={hoveredSectionId ?? navigatingSectionId}
          selectedSectionId={navigatingSectionId}
          onHover={handleHover}
          onSelect={handleSectionSelect}
        />
      </div>
    </main>
  );
};
