'use client'

type LoadingScreenProps = {
  text: string
}

export default function LoadingScreen({ text }: LoadingScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16 text-black">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-lg text-neutral-700">{text}</p>
        <div className="flex items-center gap-1 text-2xl text-neutral-400" aria-hidden>
          <span className="animate-[dot-pulse_900ms_ease-in-out_infinite]">.</span>
          <span className="animate-[dot-pulse_900ms_ease-in-out_150ms_infinite]">.</span>
          <span className="animate-[dot-pulse_900ms_ease-in-out_300ms_infinite]">.</span>
        </div>
      </div>
      <style jsx global>{`
        @keyframes dot-pulse {
          0%,
          100% {
            opacity: 0.2;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-4px);
          }
        }
      `}</style>
    </main>
  )
}
