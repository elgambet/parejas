/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import FortuneWheel from "@/components/FortuneWheel";
import useRankingData from "@/hooks/useRankingData";
import { db } from "@/lib/firebase";
import assetPath from "@/lib/assetPath";

type WinnerData = {
  id: string;
  coupleName: string;
  imageUrl: string | null;
};

export default function SorteoPage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<WinnerData | null>(null);
  const [loadingWinner, setLoadingWinner] = useState(false);
  const { entries, loading, error } = useRankingData();

  const handleSpin = () => {
    if (isSpinning || entries.length === 0) return;

    setIsSpinning(true);
    setWinner(null);
  };

  const handleSpinComplete = async (coupleId: string, coupleName: string, imageUrl: string | null) => {
    setIsSpinning(false);
    setLoadingWinner(true);

    try {
      // Fetch the couple's uploaded photo from Firestore
      const coupleDoc = doc(db, "couples", coupleId);
      const coupleSnapshot = await getDoc(coupleDoc);

      let fetchedImageUrl = null;
      if (coupleSnapshot.exists()) {
        const data = coupleSnapshot.data();
        fetchedImageUrl = data.imageUrl ?? null;
      }

      setWinner({
        id: coupleId,
        coupleName,
        imageUrl: fetchedImageUrl,
      });
    } catch (err) {
      console.error('Error fetching winner data:', err);
      setWinner({
        id: coupleId,
        coupleName,
        imageUrl: null,
      });
    } finally {
      setLoadingWinner(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-white px-6 py-16 text-black">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="font-fortalesia text-5xl leading-tight text-neutral-900">
            Sorteo de Parejas
          </h1>
          <p className="text-lg text-neutral-700">
            Presiona el botón para realizar el sorteo
          </p>
        </div>

        {loading && (
          <p className="text-sm text-neutral-500">Cargando parejas...</p>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && entries.length === 0 && (
          <p className="text-sm text-neutral-500">
            Aún no hay parejas para sortear.
          </p>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            <FortuneWheel
              entries={entries}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              winnerImageUrl={winner?.imageUrl}
            />

            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className={`rounded-full px-8 py-4 text-lg font-semibold shadow-lg transition-all ${
                  isSpinning
                    ? "cursor-not-allowed bg-neutral-400 text-neutral-200"
                    : "bg-black text-white hover:scale-105 hover:shadow-xl"
                }`}
              >
                {isSpinning ? "Sorteando..." : "Sortear"}
              </button>

              {loadingWinner && (
                <p className="text-sm text-neutral-500">Cargando ganador...</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating winner overlay */}
      {winner && !loadingWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="relative animate-[bounce_1s_ease-in-out_3] rounded-3xl border-4 border-green-500 bg-white px-8 py-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setWinner(null)}
              className="absolute right-4 top-4 rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Cerrar
            </button>

            <div className="space-y-4 text-center">
              <p className="text-sm uppercase tracking-widest text-green-700">
                Ganador
              </p>
              <p className="font-fortalesia text-5xl text-green-900">
                {winner.coupleName}
              </p>

              {winner.imageUrl && (
                <div className="mt-6">
                  <img
                    src={winner.imageUrl}
                    alt={winner.coupleName}
                    className="mx-auto h-auto max-h-96 w-full max-w-md rounded-xl object-contain shadow-lg"
                  />
                </div>
              )}

              {!winner.imageUrl && (
                <div className="mt-6">
                  <img
                    src={assetPath(`/couples/${winner.id}.svg`)}
                    alt={winner.coupleName}
                    className="mx-auto h-auto max-h-64 w-full max-w-sm rounded-xl object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = assetPath("/ranking-default.png");
                    }}
                  />
                  <p className="mt-2 text-xs italic text-neutral-600">
                    Esta pareja aún no tiene foto subida
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
