"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { db } from "@/lib/firebase";

type RankingEntry = {
  id: string;
  coupleName: string;
  updatedAt: Date | null;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
};

type RankingDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

function formatElapsed(updatedAt: Date | null, now: Date): string {
  if (!updatedAt) return "Sin tiempo";

  const diffMs = Math.max(0, now.getTime() - updatedAt.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(diffMs / 3600000);

  if (totalMinutes < 60) {
    const value = Math.max(1, totalMinutes);
    return `Hace ${value} minuto${value === 1 ? "" : "s"}`;
  }

  if (totalHours < 24) {
    const hours = totalHours;
    const minutes = Math.floor((diffMs - hours * 3600000) / 60000);
    const hoursText = `${hours} hora${hours === 1 ? "" : "s"}`;
    const minutesText = `${minutes} minuto${minutes === 1 ? "" : "s"}`;
    return `Hace ${hoursText} y ${minutesText}`;
  }

  const formattedDate = updatedAt.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `El ${formattedDate}`;
}

function extractDate(value: { toDate?: () => Date } | undefined): Date | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return null;
}

function toPositiveNumber(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return null;
  }
  return value;
}

export default function RankingDrawer({ isOpen, onClose }: RankingDrawerProps) {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [openCount, setOpenCount] = useState(0);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [missingCoupleImages, setMissingCoupleImages] = useState<Set<string>>(
    new Set(),
  );
  const [uploadedStates, setUploadedStates] = useState<
    Record<string, "idle" | "loading" | "loaded" | "error">
  >({});

  useEffect(() => {
    if (!isOpen) return;

    setOpenCount((count) => count + 1);
    setRevealedIds(new Set());
    setUploadedStates({});

    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadRanking = async () => {
      try {
        setLoading(true);
        setError(null);

        const rankingQuery = query(
          collection(db, "couples"),
          orderBy("updatedAt", "asc"),
        );
        const snapshot = await getDocs(rankingQuery);
        if (cancelled) return;

        const rows = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as {
            coupleName?: string;
            updatedAt?: { toDate?: () => Date };
            imageUrl?: string;
            imageWidth?: number;
            imageHeight?: number;
          };

          return {
            id: docSnapshot.id,
            coupleName: data.coupleName ?? docSnapshot.id,
            updatedAt: extractDate(data.updatedAt),
            imageUrl: data.imageUrl ?? null,
            imageWidth: toPositiveNumber(data.imageWidth),
            imageHeight: toPositiveNumber(data.imageHeight),
          };
        });

        setEntries(rows);
      } catch (err) {
        if (cancelled) return;
        setError("No se pudo cargar la tabla de tiempos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRanking();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const renderedEntries = useMemo(
    () =>
      entries.map((entry, index) => ({
        ...entry,
        elapsedText: formatElapsed(entry.updatedAt, now),
        delayMs: Math.min(index * 70, 900),
      })),
    [entries, now],
  );

  const handleReveal = (id: string) => {
    setRevealedIds((current) => new Set(current).add(id));
    setUploadedStates((current) => ({ ...current, [id]: "loading" }));
  };

  const handleCoupleImageError = (id: string) => {
    setMissingCoupleImages((current) => new Set(current).add(id));
  };

  const handleUploadedImageLoad = (id: string) => {
    setUploadedStates((current) => ({ ...current, [id]: "loaded" }));
  };

  const handleUploadedImageError = (id: string) => {
    setUploadedStates((current) => ({ ...current, [id]: "error" }));
  };

  const getCoupleImageSrc = (id: string) =>
    missingCoupleImages.has(id) ? "/ranking-default.png" : `/couples/${id}.svg`;

  return (
    <div
      className={`fixed inset-0 z-40 ${isOpen ? "" : "pointer-events-none"}`}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-neutral-500">
                Ranking
              </p>
              <h2 className="font-fortalesia text-4xl leading-tight text-neutral-900">
                Tabla de tiempos
              </h2>
            </div>
            <button
              type="button"
              className="rounded-full border border-neutral-200 px-3 py-1 text-sm"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>

          <div key={openCount} className="flex-1 overflow-y-auto px-6 py-4">
            {loading && (
              <p className="text-sm text-neutral-500">Cargando ranking...</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && renderedEntries.length === 0 && (
              <p className="text-sm text-neutral-500">
                Aún no hay parejas encontradas.
              </p>
            )}

            <div className="space-y-4">
              {renderedEntries.map((entry, index) => {
                const isRevealed = revealedIds.has(entry.id);
                const canReveal = Boolean(entry.imageUrl);
                const uploadedState = uploadedStates[entry.id] ?? "idle";
                const showSkeleton = Boolean(
                  canReveal &&
                  isRevealed &&
                  uploadedState !== "loaded" &&
                  uploadedState !== "error",
                );
                const showUploadedImage = Boolean(
                  canReveal && isRevealed && uploadedState === "loaded",
                );
                const showUploadedFallback = Boolean(
                  canReveal && isRevealed && uploadedState === "error",
                );
                const imageAspectRatio =
                  entry.imageWidth && entry.imageHeight
                    ? `${entry.imageWidth} / ${entry.imageHeight}`
                    : "4 / 3";

                return (
                  <div
                    key={`${openCount}-${entry.id}`}
                    className="translate-y-12 opacity-0 animate-[slide-in_650ms_cubic-bezier(0.2,0.7,0.2,1)_forwards] rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
                    style={{ animationDelay: `${entry.delayMs}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm uppercase tracking-widest text-neutral-400">
                        Puesto {index + 1}
                      </p>
                      {canReveal && !isRevealed && (
                        <button
                          type="button"
                          className="rounded-full border border-neutral-200 px-3 py-1 text-xs"
                          onClick={() => handleReveal(entry.id)}
                        >
                          Descubrir
                        </button>
                      )}
                    </div>
                    <p className="text-base font-semibold text-neutral-900">
                      {entry.coupleName}
                    </p>
                    <div className="mt-3">
                      <div
                        className={`overflow-hidden transition-[max-height,opacity] duration-1000 ease-in-out ${
                          isRevealed && canReveal
                            ? "max-h-0 opacity-0"
                            : "max-h-[800px] opacity-100"
                        } flex justify-center`}
                      >
                        <img
                          src={getCoupleImageSrc(entry.id)}
                          alt={entry.coupleName}
                          className="mb-2 h-auto w-full rounded-xl"
                          onError={
                            missingCoupleImages.has(entry.id)
                              ? undefined
                              : () => handleCoupleImageError(entry.id)
                          }
                        />
                      </div>
                      {canReveal && isRevealed && (
                        <div
                          className="relative mt-3 flex w-full items-center justify-center overflow-hidden rounded-xl"
                          style={{ aspectRatio: imageAspectRatio }}
                        >
                          {showSkeleton && (
                            <div className="loading-shimmer absolute inset-0" />
                          )}
                          {!showUploadedFallback ? (
                            <img
                              src={entry.imageUrl ?? undefined}
                              alt={entry.coupleName}
                              className={`absolute inset-0 mx-auto h-full max-w-full rounded-xl object-contain transition-opacity duration-500 ${
                                showUploadedImage ? "opacity-100" : "opacity-0"
                              }`}
                              onLoad={() => handleUploadedImageLoad(entry.id)}
                              onError={() => handleUploadedImageError(entry.id)}
                            />
                          ) : (
                            <img
                              src="/image-not-found.png"
                              alt={entry.coupleName}
                              className="h-full max-w-full rounded-xl object-contain"
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600">
                      {entry.elapsedText}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @keyframes slide-in {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .loading-shimmer {
          background: linear-gradient(
            90deg,
            rgba(229, 231, 235, 0.9) 0%,
            rgba(243, 244, 246, 0.9) 45%,
            rgba(229, 231, 235, 0.9) 90%
          );
          background-size: 200% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
