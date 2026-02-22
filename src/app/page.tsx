'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  User,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'

import { auth, db, googleAuthProvider, storage } from '@/lib/firebase'

type CoupleRecord = {
  coupleName: string
  imageUrl: string
}

type ValidCoupleRecord = {
  coupleKey: string
  coupleName: string
}

function readCoupleKeyParam(rawValue: string | null): string | null {
  if (!rawValue) return null
  const decoded = decodeURIComponent(rawValue).trim().toLowerCase()
  return decoded.length ? decoded : null
}

export default function Home() {
  const searchParams = useSearchParams()
  const coupleKey = useMemo(
    () => readCoupleKeyParam(searchParams.get('couple')),
    [searchParams]
  )

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isValidCouple, setIsValidCouple] = useState<boolean | null>(null)
  const [displayCoupleName, setDisplayCoupleName] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setAuthReady(true)
      setAuthError(null)

      if (!currentUser) {
        try {
          await signInAnonymously(auth)
        } catch (error) {
          setAuthError('No se pudo iniciar la sesión anónima.')
        }
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!coupleKey) {
      setStatus('error')
      setErrorMessage('Falta el parámetro couple en la URL.')
      setIsValidCouple(false)
      return
    }

    let cancelled = false

    const loadCoupleData = async () => {
      try {
        setStatus('loading')
        setErrorMessage(null)

        const directDoc = doc(db, 'validCouples', coupleKey)
        const directSnapshot = await getDoc(directDoc)

        if (cancelled) return

        if (directSnapshot.exists()) {
          const data = directSnapshot.data() as ValidCoupleRecord
          setIsValidCouple(true)
          setDisplayCoupleName(data.coupleName ?? coupleKey)
        } else {
          const listQuery = query(
            collection(db, 'validCouples'),
            where('coupleKey', '==', coupleKey)
          )
          const listSnapshot = await getDocs(listQuery)
          if (cancelled) return

          if (!listSnapshot.empty) {
            const data = listSnapshot.docs[0].data() as ValidCoupleRecord
            setIsValidCouple(true)
            setDisplayCoupleName(data.coupleName ?? coupleKey)
          } else {
            setIsValidCouple(false)
            setDisplayCoupleName(coupleKey)
          }
        }

        if (!cancelled && (isValidCouple || directSnapshot.exists())) {
          const docRef = doc(db, 'couples', coupleKey)
          const snapshot = await getDoc(docRef)
          if (cancelled) return

          if (snapshot.exists()) {
            const data = snapshot.data() as CoupleRecord
            setImageUrl(data.imageUrl)
          } else {
            setImageUrl(null)
          }
        } else {
          setImageUrl(null)
        }

        setStatus('ready')
      } catch (error) {
        if (cancelled) return
        setStatus('error')
        setErrorMessage('Hubo un problema al cargar la información. Intentalo de nuevo.')
      }
    }

    loadCoupleData()

    return () => {
      cancelled = true
    }
  }, [coupleKey, isValidCouple])

  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null)
      await signInWithPopup(auth, googleAuthProvider)
    } catch (error) {
      setAuthError('No se pudo iniciar sesión con Google.')
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !coupleKey || !user || !isValidCouple) return

    try {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Solo se permiten imágenes.')
        return
      }

      setUploading(true)
      setErrorMessage(null)

      const storageRef = ref(storage, `couples/${coupleKey}/photo`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      const docRef = doc(db, 'couples', coupleKey)
      await setDoc(
        docRef,
        {
          coupleName: displayCoupleName ?? coupleKey,
          imageUrl: url,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      setImageUrl(url)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
      setErrorMessage('No se pudo subir la foto. Intentalo de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const showInvalidMessage = isValidCouple === false && coupleKey
  const coupleLabel = displayCoupleName ?? coupleKey

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

        {status === 'loading' && <p className="text-neutral-500">Cargando...</p>}

        {imageUrl && (
          <div className="rounded-2xl border border-neutral-200 p-4">
            <img src={imageUrl} alt={coupleLabel ?? 'Couple photo'} className="w-full rounded-xl" />
          </div>
        )}

        {coupleKey && isValidCouple && (
          <label className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 px-6 py-8">
            <span className="text-sm text-neutral-600">
              {uploading ? 'Subiendo foto...' : imageUrl ? 'Reemplazar foto' : 'Elegir una foto'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-white"
              onChange={handleFileChange}
              disabled={uploading || !user}
            />
          </label>
        )}

        {!user && authReady && (
          <button
            type="button"
            className="rounded-full bg-black px-5 py-2 text-sm text-white"
            onClick={handleGoogleSignIn}
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
