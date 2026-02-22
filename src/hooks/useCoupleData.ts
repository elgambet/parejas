import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { User } from 'firebase/auth'

import { db, storage } from '@/lib/firebase'

type CoupleRecord = {
  coupleName: string
  imageUrl: string
}

type ValidCoupleRecord = {
  coupleKey: string
  coupleName: string
}

type UseCoupleDataState = {
  coupleKey: string | null
  displayCoupleName: string | null
  imageUrl: string | null
  isValidCouple: boolean | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  errorMessage: string | null
  uploadImage: (file: File, user: User) => Promise<void>
}

function readCoupleKeyParam(rawValue: string | null): string | null {
  if (!rawValue) return null
  const decoded = decodeURIComponent(rawValue).trim().toLowerCase()
  return decoded.length ? decoded : null
}

export default function useCoupleData(): UseCoupleDataState {
  const searchParams = useSearchParams()
  const coupleKey = useMemo(
    () => readCoupleKeyParam(searchParams.get('couple')),
    [searchParams]
  )

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isValidCouple, setIsValidCouple] = useState<boolean | null>(null)
  const [displayCoupleName, setDisplayCoupleName] = useState<string | null>(null)

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

        let resolvedValid = false

        if (directSnapshot.exists()) {
          const data = directSnapshot.data() as ValidCoupleRecord
          resolvedValid = true
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
            resolvedValid = true
            setIsValidCouple(true)
            setDisplayCoupleName(data.coupleName ?? coupleKey)
          } else {
            setIsValidCouple(false)
            setDisplayCoupleName(coupleKey)
          }
        }

        if (!cancelled && resolvedValid) {
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
  }, [coupleKey])

  const uploadImage = async (file: File, user: User) => {
    if (!coupleKey) return

    try {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Solo se permiten imágenes.')
        return
      }

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
    }
  }

  return {
    coupleKey,
    displayCoupleName,
    imageUrl,
    isValidCouple,
    status,
    errorMessage,
    uploadImage,
  }
}
