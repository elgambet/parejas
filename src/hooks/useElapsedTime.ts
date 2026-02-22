import { useEffect, useMemo, useState } from 'react'

type ElapsedTimeState = {
  elapsedText: string | null
}

function formatElapsed(updatedAt: Date | null, now: Date): string | null {
  if (!updatedAt) return null

  const diffMs = Math.max(0, now.getTime() - updatedAt.getTime())
  const totalMinutes = Math.floor(diffMs / 60000)
  const totalHours = Math.floor(diffMs / 3600000)

  if (totalMinutes < 60) {
    const value = Math.max(1, totalMinutes)
    return `${value} minuto${value === 1 ? '' : 's'}`
  }

  if (totalHours < 24) {
    const hours = totalHours
    const minutes = Math.floor((diffMs - hours * 3600000) / 60000)
    const hoursText = `${hours} hora${hours === 1 ? '' : 's'}`
    const minutesText = `${minutes} minuto${minutes === 1 ? '' : 's'}`
    return `${hoursText} y ${minutesText}`
  }

  const formattedDate = updatedAt.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `el ${formattedDate}`
}

export default function useElapsedTime(updatedAt: Date | null): ElapsedTimeState {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!updatedAt) return

    const interval = setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [updatedAt])

  const elapsedText = useMemo(() => formatElapsed(updatedAt, now), [updatedAt, now])

  return { elapsedText }
}
