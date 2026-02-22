import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyCkjqgni2ofUU4Q8RsOXxd-MrITC5KKI9A',
  authDomain: 'olivia-86372.firebaseapp.com',
  projectId: 'olivia-86372',
  storageBucket: 'olivia-86372.firebasestorage.app',
  messagingSenderId: '351277262542',
  appId: '1:351277262542:web:4e989cd5e1b24ddb68529f',
  measurementId: 'G-1HZNFMHQE7',
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleAuthProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)
