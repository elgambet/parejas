import './globals.css'
import type { Metadata } from 'next'
import { Lora } from 'next/font/google'
import localFont from 'next/font/local'

const lora = Lora({ subsets: ['latin'] })
const fortalesia = localFont({
  src: '../../public/FortalesiaPlain_PERSONAL_USE_ONLY.otf',
  variable: '--font-fortalesia',
  display: 'swap',
})

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
      <body className={`${lora.className} ${fortalesia.variable}`}>{children}</body>
    </html>
  )
}
