"use client";

import { useEffect, useMemo, useState } from "react";

type UploadSuccessModalProps = {
  isOpen: boolean;
  coupleName: string;
  coupleKey: string | null;
  fallbackImageUrl?: string | null;
  onClose: () => void;
};

type HeartDot = {
  corner: "top-left" | "top-right" | "bottom-right" | "bottom-left";
  color: string;
  delay: string;
  size: string;
};

const HEART_COLORS = ["#ef4444", "#22c55e", "#3b82f6"];

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHeartPositions(): Array<HeartDot["corner"]> {
  const corners: HeartDot["corner"][] = [
    "top-left",
    "top-right",
    "bottom-right",
    "bottom-left",
  ];

  const shuffled = [...corners].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function getCornerClass(corner: HeartDot["corner"]): string {
  switch (corner) {
    case "top-left":
      return "-left-3 -top-3";
    case "top-right":
      return "-right-3 -top-3";
    case "bottom-right":
      return "-bottom-3 -right-3";
    case "bottom-left":
      return "-bottom-3 -left-3";
    default:
      return "-left-3 -top-3";
  }
}

export default function UploadSuccessModal({
  isOpen,
  coupleName,
  coupleKey,
  fallbackImageUrl = null,
  onClose,
}: UploadSuccessModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coupleImageUrl, setCoupleImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => setIsVisible(true), 20);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;

    const resolveBackground = async () => {
      if (!isOpen || !coupleKey) {
        setCoupleImageUrl(null);
        return;
      }

      const candidates = [
        `/couples/${coupleKey}.png`,
        `/couples/${coupleKey}.jpg`,
        `/couples/${coupleKey}.jpeg`,
        `/couples/${coupleKey}.webp`,
        `/couples/${coupleKey}.svg`,
      ];

      for (const candidate of candidates) {
        const image = new Image();
        image.src = candidate;
        const exists = await new Promise<boolean>((resolve) => {
          image.onload = () => resolve(true);
          image.onerror = () => resolve(false);
        });

        if (cancelled) return;
        if (exists) {
          setCoupleImageUrl(candidate);
          return;
        }
      }

      setCoupleImageUrl(null);
    };

    resolveBackground();

    return () => {
      cancelled = true;
    };
  }, [isOpen, coupleKey]);

  const displayedImageUrl = coupleImageUrl ?? fallbackImageUrl;

  const hearts = useMemo<HeartDot[]>(() => {
    if (!isOpen) return [];

    const positions = generateHeartPositions();

    return HEART_COLORS.map((color, index) => ({
      corner: positions[index] ?? "top-left",
      color,
      delay: `${index * 180}ms`,
      size: `${randomInRange(28, 40)}px`,
    }));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="relative z-[120] flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
          aria-label="Cerrar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-3xl font-bold text-neutral-900">Felicitaciones!</h2>
        {displayedImageUrl && (
          <div className="relative mt-4 flex-1 overflow-visible">
            {hearts.map((heart, index) => (
              <span
                key={`${heart.color}-${index}`}
                className={`pointer-events-none absolute z-[130] animate-[heart-beat_1.2s_ease-in-out_infinite] ${getCornerClass(heart.corner)}`}
                style={{
                  color: heart.color,
                  fontSize: heart.size,
                  animationDelay: heart.delay,
                }}
                aria-hidden="true"
              >
                ❤
              </span>
            ))}
            <div className="h-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-2">
              <img
                src={displayedImageUrl}
                alt={coupleName}
                className="h-full w-full rounded-lg object-contain"
              />
            </div>
          </div>
        )}
        <p className="mt-3 text-xl text-neutral-700">{coupleName} se encontraron!</p>
      </div>

      <style jsx global>{`
        @keyframes heart-beat {
          0%,
          100% {
            transform: scale(0.95);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.25);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
