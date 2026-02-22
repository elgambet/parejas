/* eslint-disable react/no-unescaped-entities */
"use client";

import { useId, useState } from "react";

import LoadingScreen from "@/components/LoadingScreen";
import RankingDrawer from "@/components/RankingDrawer";
import useCoupleData from "@/hooks/useCoupleData";
import useElapsedTime from "@/hooks/useElapsedTime";
import useImageReveal from "@/hooks/useImageReveal";
import useLoader from "@/hooks/useLoader";
import useSession from "@/hooks/useSession";

export default function Home() {
  const [showReplacePicker, setShowReplacePicker] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const uploadInputId = useId();
  const replaceInputId = useId();

  const { user, authReady, authError, signInWithGoogle } = useSession();
  const {
    coupleKey,
    displayCoupleName,
    imageUrl,
    updatedAt,
    isValidCouple,
    status,
    errorMessage,
    uploadImage,
  } = useCoupleData();

  const { elapsedText } = useElapsedTime(updatedAt);
  const { isVisible: isImageVisible } = useImageReveal(imageUrl);

  const { showLoader, loaderText, handleFileChange } = useLoader({
    status,
    coupleKey,
    isValidCouple,
    user,
    uploadImage,
  });

  const showInvalidMessage = isValidCouple === false && coupleKey;
  const coupleLabel = displayCoupleName ?? coupleKey;

  if (showLoader) {
    const text =
      loaderText === "Subiendo foto..."
        ? "Subiendo la foto..."
        : "Preparando la búsqueda...";
    return <LoadingScreen text={text} />;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-6 py-16 text-black">
      <button
        type="button"
        className="absolute right-6 top-6 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm shadow-sm"
        onClick={() => setIsRankingOpen(true)}
      >
        Ver ranking
      </button>

      <RankingDrawer
        isOpen={isRankingOpen}
        onClose={() => setIsRankingOpen(false)}
      />

      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">Búsqueda de parejas</h1>
          {coupleKey ? (
            <div className="space-y-2 text-lg text-neutral-700">
              {showInvalidMessage ? (
                <p>Esa pareja no está en la lista: "{coupleLabel}".</p>
              ) : imageUrl ? (
                <p>¡Encontrada! {coupleLabel} ya está unida.</p>
              ) : (
                <p>
                  La pareja "{coupleLabel}" aún no se encuentra, buscala antes
                  que se ponga triste...
                </p>
              )}
            </div>
          ) : (
            <p className="text-lg text-neutral-700">
              Entrá con el QR de tu asiento para empezar la búsqueda.
            </p>
          )}
        </div>

        {imageUrl && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="relative w-full overflow-hidden rounded-xl bg-neutral-100 aspect-[4/3]">
                {!isImageVisible && (
                  <div className="absolute inset-0">
                    <div className="h-full w-full animate-[shimmer_1.2s_ease-in-out_infinite] bg-[linear-gradient(110deg,#f3f4f6,45%,#e5e7eb,55%,#f3f4f6)] bg-[length:200%_100%]" />
                  </div>
                )}
                <img
                  src={imageUrl}
                  alt={coupleLabel ?? "Couple photo"}
                  className={`absolute inset-0 h-full w-full rounded-xl object-cover transition-all duration-500 ${
                    isImageVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-3"
                  }`}
                />
              </div>
            </div>
            {elapsedText && (
              <p className="text-sm italic text-neutral-500">
                Se encontraron hace {elapsedText}
              </p>
            )}
          </div>
        )}

        {coupleKey && isValidCouple && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 px-6 py-8">
            {imageUrl ? (
              <>
                {!showReplacePicker && (
                  <button
                    type="button"
                    className="rounded-full bg-black px-5 py-2 text-sm text-white"
                    onClick={() => setShowReplacePicker(true)}
                    disabled={!user}
                  >
                    Reemplazar foto
                  </button>
                )}
                {showReplacePicker && (
                  <>
                    <input
                      id={replaceInputId}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={!user}
                    />
                    <label
                      htmlFor={replaceInputId}
                      className="cursor-pointer rounded-full bg-black px-5 py-2 text-sm text-white"
                    >
                      Elegir foto
                    </label>
                    <p className="text-xs text-neutral-500">
                      Esta nueva foto actualizará el tiempo del encuentro.
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="text-sm text-neutral-600">
                  Subir foto de la pareja
                </span>
                <input
                  id={uploadInputId}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={!user}
                />
                <label
                  htmlFor={uploadInputId}
                  className="cursor-pointer rounded-full bg-black px-5 py-2 text-sm text-white"
                >
                  Elegir foto
                </label>
              </>
            )}
          </div>
        )}

        {!user && authReady && (
          <button
            type="button"
            className="rounded-full bg-black px-5 py-2 text-sm text-white"
            onClick={signInWithGoogle}
          >
            Iniciar sesión con Google
          </button>
        )}

        {authError && <p className="text-sm text-red-600">{authError}</p>}

        {status === "error" && errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </main>
  );
}
