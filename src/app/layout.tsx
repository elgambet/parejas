import './globals.css'
import type { Metadata } from 'next'
import { Lora } from 'next/font/google'

const lora = Lora({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Búsqueda de parejas',
  description: 'Encuentra a tu pareja y subí una foto juntos.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={lora.className}>{children}</body>
    </html>
  )
}
