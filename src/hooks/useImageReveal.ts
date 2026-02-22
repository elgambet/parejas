import { useEffect, useState } from 'react'

type ImageRevealState = {
  isVisible: boolean
}

export default function useImageReveal(imageUrl: string | null): ImageRevealState {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let cancelled = false

    const revealImage = async () => {
      setIsVisible(false)

      if (!imageUrl) return

      try {
        const image = new Image()
        image.src = imageUrl

        if (image.decode) {
          await image.decode()
        } else {
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error('Image failed to load'))
          })
        }

        if (!cancelled) {
          setIsVisible(true)
        }
      } catch (error) {
        if (!cancelled) {
          setIsVisible(true)
        }
      }
    }

    revealImage()

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  return { isVisible }
}
