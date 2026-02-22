'use client'

import useCoupleData from '@/hooks/useCoupleData'
import useLoader from '@/hooks/useLoader'
import useSession from '@/hooks/useSession'

export default function Home() {
  const { user, authReady, authError, signInWithGoogle } = useSession()
  const {
    coupleKey,
    displayCoupleName,
    imageUrl,
    isValidCouple,
    status,
    errorMessage,
    uploadImage,
  } = useCoupleData()

  const { showLoader, loaderText, handleFileChange } = useLoader({
    status,
    coupleKey,
    isValidCouple,
    user,
    uploadImage,
  })

  const showInvalidMessage = isValidCouple === false && coupleKey
  const coupleLabel = displayCoupleName ?? coupleKey

  if (showLoader) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16 text-black">
        <div className="text-center">
          <p className="text-lg text-neutral-700">{loaderText}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16 text-black">
      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">Fotos de parejas</h1>
          {coupleKey ? (
            <p className="text-lg text-neutral-700">
              {showInvalidMessage
                ? `La pareja "${coupleLabel}" no es válida.`
                : imageUrl
                ? `Excelente, la pareja esta unida: ${coupleLabel}`
                : `Subí una foto de la pareja "${coupleLabel}"`}
            </p>
          ) : (
            <p className="text-lg text-neutral-700">Comparte una URL con el parámetro couple.</p>
          )}
        </div>

        {imageUrl && (
          <div className="rounded-2xl border border-neutral-200 p-4">
            <img src={imageUrl} alt={coupleLabel ?? 'Couple photo'} className="w-full rounded-xl" />
          </div>
        )}

        {coupleKey && isValidCouple && (
          <label className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 px-6 py-8">
            <span className="text-sm text-neutral-600">
              {imageUrl ? 'Reemplazar foto' : 'Elegir una foto'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-white"
              onChange={handleFileChange}
              disabled={!user}
            />
          </label>
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

        {status === 'error' && errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    </main>
  )
}
