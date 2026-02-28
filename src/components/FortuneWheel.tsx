"use client";

import { useEffect, useRef, useState } from "react";
import assetPath from "@/lib/assetPath";

type RankingEntry = {
  id: string;
  coupleName: string;
};

type FortuneWheelProps = {
  entries: RankingEntry[];
  isSpinning: boolean;
  onSpinComplete: (coupleId: string, coupleName: string, imageUrl: string | null) => void;
  winnerImageUrl?: string | null;
};

export default function FortuneWheel({
  entries,
  isSpinning,
  onSpinComplete,
  winnerImageUrl,
}: FortuneWheelProps) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create a large array by repeating entries to enable smooth infinite scroll
  const repeatedEntries = [...entries, ...entries, ...entries, ...entries, ...entries, ...entries, ...entries, ...entries];
  const itemHeight = 120; // Height of each item in pixels
  const containerHeight = 400; // Height of the visible container
  const centerOffset = containerHeight / 2; // Center point of the container

  useEffect(() => {
    if (!isSpinning || isAnimating || entries.length === 0) return;

    setSelectedWinnerId(null);

    // Generate random parameters for the spin
    const minSpins = 4; // Minimum number of full cycles
    const maxSpins = 7; // Maximum number of full cycles

    // Select a random winner index
    const winnerIndex = Math.floor(Math.random() * entries.length);
    const selectedEntry = entries[winnerIndex];

    // Add random starting offset to make it more varied
    const randomStartOffset = Math.random() * entries.length * itemHeight;

    // Calculate the scroll offset to center the winner
    // We need to scroll to position the winner's CENTER at the viewport center (scrollOffset)
    // The item center is at: winnerIndex * itemHeight + itemHeight / 2
    // After repeating the list, we use a later occurrence for smooth animation
    const repeatCycle = Math.floor(minSpins + Math.random() * (maxSpins - minSpins));
    const targetItemIndex = repeatCycle * entries.length + winnerIndex;
    const targetItemCenter = targetItemIndex * itemHeight + itemHeight / 2;

    // The scrollOffset represents the center of the viewport
    // So we want scrollOffset to equal targetItemCenter
    const totalDistance = randomStartOffset + targetItemCenter;

    // Duration of the animation in milliseconds
    const duration = 5000; // 5 seconds

    setIsAnimating(true);
    setScrollOffset(randomStartOffset); // Start from random position
    startTimeRef.current = null;

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: starts fast, ends slow (ease-out cubic)
      const easeOutCubic = (t: number): number => {
        return 1 - Math.pow(1 - t, 3);
      };

      const easedProgress = easeOutCubic(progress);
      const currentScroll = randomStartOffset + easedProgress * (totalDistance - randomStartOffset);

      setScrollOffset(currentScroll);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setIsAnimating(false);
        setSelectedWinnerId(selectedEntry.id);

        // Call the completion callback
        onSpinComplete(selectedEntry.id, selectedEntry.coupleName, null);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpinning, entries, onSpinComplete]);

  return (
    <div className="relative w-full">
      {/* Container with fixed height and overflow hidden */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-neutral-300 bg-gradient-to-b from-neutral-50 to-white" style={{ height: `${containerHeight}px` }}>
        {/* Top fade overlay */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-24 bg-gradient-to-b from-white to-transparent" />

        {/* Center highlight indicator */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-20 -translate-y-1/2">
          <div className="mx-4 rounded-xl border-4 border-yellow-400 bg-yellow-100/30 shadow-lg backdrop-blur-sm" style={{ height: `${itemHeight}px` }}>
            <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rotate-45 border-b-4 border-l-4 border-yellow-400 bg-yellow-100" />
            <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rotate-45 border-r-4 border-t-4 border-yellow-400 bg-yellow-100" />

            {/* Winner photo overlay - shown after animation completes */}
            {selectedWinnerId && winnerImageUrl && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/95 p-2">
                <img
                  src={winnerImageUrl}
                  alt="Winner"
                  className="h-full w-full rounded-lg object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom fade overlay */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-white to-transparent" />

        {/* Scrolling list */}
        <div
          ref={containerRef}
          className="relative"
          style={{
            transform: `translateY(calc(${centerOffset}px - ${scrollOffset}px - ${itemHeight / 2}px))`,
          }}
        >
          {repeatedEntries.map((entry, index) => {
            // Calculate the position of this item relative to the scroll
            const itemTop = index * itemHeight;
            const itemCenter = itemTop + itemHeight / 2;
            const viewportCenter = scrollOffset;
            const distanceFromCenter = Math.abs(itemCenter - viewportCenter);

            // Scale and opacity based on distance from center
            const maxDistance = containerHeight / 2;
            const normalizedDistance = Math.min(distanceFromCenter / maxDistance, 1);
            const scale = 1 - normalizedDistance * 0.3; // Scale from 1.0 to 0.7
            const opacity = 1 - normalizedDistance * 0.6; // Opacity from 1.0 to 0.4

            // Check if this is the center item
            const isCenter = distanceFromCenter < itemHeight / 2;
            const isCenteredWinner = selectedWinnerId && entry.id === selectedWinnerId && isCenter;

            return (
              <div
                key={`${entry.id}-${index}`}
                className="flex items-center justify-between px-6 transition-all"
                style={{
                  height: `${itemHeight}px`,
                  transform: `scale(${scale})`,
                  opacity: isCenteredWinner && winnerImageUrl ? 0 : opacity,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 transition-all ${
                      isCenter
                        ? "border-yellow-400 shadow-lg"
                        : "border-neutral-200"
                    }`}
                  >
                    <img
                      src={assetPath(`/couples/${entry.id}.svg`)}
                      alt={entry.coupleName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = assetPath("/ranking-default.png");
                      }}
                    />
                  </div>
                  <p
                    className={`font-semibold transition-all ${
                      isCenter
                        ? "text-2xl text-neutral-900"
                        : "text-lg text-neutral-600"
                    }`}
                  >
                    {entry.coupleName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
