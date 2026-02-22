"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { db } from "@/lib/firebase";

type RankingEntry = {
  id: string;
  coupleName: string;
  updatedAt: Date | null;
  imageUrl: string | null;
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

export default function RankingDrawer({ isOpen, onClose }: RankingDrawerProps) {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    setOpenCount((count) => count + 1);

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
          orderBy("updatedAt", "desc"),
        );
        const snapshot = await getDocs(rankingQuery);
        if (cancelled) return;

        const rows = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as {
            coupleName?: string;
            updatedAt?: { toDate?: () => Date };
            imageUrl?: string;
          };

          return {
            id: docSnapshot.id,
            coupleName: data.coupleName ?? docSnapshot.id,
            updatedAt: extractDate(data.updatedAt),
            imageUrl: data.imageUrl ?? null,
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
              <h2 className="text-xl font-semibold text-neutral-900">
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
              {renderedEntries.map((entry, index) => (
                <div
                  key={`${openCount}-${entry.id}`}
                  className="translate-y-12 opacity-0 animate-[slide-in_650ms_cubic-bezier(0.2,0.7,0.2,1)_forwards] rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
                  style={{ animationDelay: `${entry.delayMs}ms` }}
                >
                  <p className="text-sm uppercase tracking-widest text-neutral-400">
                    Puesto {index + 1}
                  </p>
                  <p className="text-base font-semibold text-neutral-900">
                    {entry.coupleName}
                  </p>
                  {entry.imageUrl && (
                    <div
                      className="mt-3 overflow-hidden opacity-0 max-h-0 animate-[reveal_600ms_ease-out_forwards]"
                      style={{ animationDelay: `${entry.delayMs + 520}ms` }}
                    >
                      <img
                        src={entry.imageUrl}
                        alt={entry.coupleName}
                        className="h-28 w-full rounded-xl object-cover"
                      />
                    </div>
                  )}
                  <p className="text-sm italic text-neutral-500">
                    {entry.elapsedText}
                  </p>
                </div>
              ))}
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

        @keyframes reveal {
          to {
            opacity: 1;
            max-height: 7rem;
          }
        }
      `}</style>
    </div>
  );
}
