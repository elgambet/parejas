import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously, signInWithPopup, User } from 'firebase/auth'

import { auth, googleAuthProvider } from '@/lib/firebase'

type SessionState = {
  user: User | null
  authReady: boolean
  authError: string | null
  signInWithGoogle: () => Promise<void>
}

export default function useSession(): SessionState {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

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

  const signInWithGoogle = async () => {
    try {
      setAuthError(null)
      await signInWithPopup(auth, googleAuthProvider)
    } catch (error) {
      setAuthError('No se pudo iniciar sesión con Google.')
    }
  }

  return { user, authReady, authError, signInWithGoogle }
}
