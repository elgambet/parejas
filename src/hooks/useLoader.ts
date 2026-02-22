import { useState } from 'react'
import { User } from 'firebase/auth'

type LoaderState = {
  showLoader: boolean
  loaderText: string
  uploading: boolean
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}

type UseLoaderInput = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  coupleKey: string | null
  isValidCouple: boolean | null
  user: User | null
  uploadImage: (file: File, user: User) => Promise<void>
}

export default function useLoader({
  status,
  coupleKey,
  isValidCouple,
  user,
  uploadImage,
}: UseLoaderInput): LoaderState {
  const [uploading, setUploading] = useState(false)

  const showLoader = uploading || status === 'loading' || (coupleKey && isValidCouple === null)
  const loaderText = uploading ? 'Subiendo foto...' : 'Cargando...'

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user || !isValidCouple) return

    setUploading(true)
    try {
      await uploadImage(file, user)
    } finally {
      setUploading(false)
    }
  }

  return { showLoader, loaderText, uploading, handleFileChange }
}
