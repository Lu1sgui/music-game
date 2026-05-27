// app/components/Avatar.tsx
// Renders a DiceBear avatar from a seed + style
// CDN: https://api.dicebear.com/9.x/{style}/svg?seed={seed}

interface AvatarProps {
  seed?: string | null
  style?: string
  size?: number
  border?: boolean
}

export default function Avatar({ seed, style = 'miniavs', size = 40, border = true }: AvatarProps) {
  const s = seed ?? 'default'
  const url = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(s)}&backgroundColor=0e1228`

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--bg-card)',
      border: border ? '2px solid var(--border)' : 'none',
      overflow: 'hidden', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img
        src={url}
        alt="avatar"
        width={size}
        height={size}
        style={{ display: 'block' }}
        onError={(e) => {
          // Fallback: show first letter of seed
          (e.target as HTMLImageElement).style.display = 'none'
        }}
      />
    </div>
  )
}
