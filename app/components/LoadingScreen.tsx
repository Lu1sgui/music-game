'use client'
// app/components/LoadingScreen.tsx
// Reusable loading state with floating Devin image

interface LoadingScreenProps {
  label?: string
  size?: number
}

export default function LoadingScreen({ label = 'LOADING', size = 110 }: LoadingScreenProps) {
  return (
    <div className="flex-center" style={{ flexDirection: 'column', gap: 12, minHeight: '60dvh' }}>
      <img
        src="/devinsloads.webp"
        alt="Loading..."
        width={size}
        style={{
          imageRendering: 'pixelated',
          animation: 'float 2s ease-in-out infinite',
          filter: 'drop-shadow(0 8px 16px rgba(255,45,135,0.3))',
        }}
      />
      <span className="font-pixel txt-pink" style={{ fontSize: 9 }}>
        {label}<span className="anim-blink">_</span>
      </span>
    </div>
  )
}
