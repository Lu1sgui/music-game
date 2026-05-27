'use client'
// app/components/AvatarPicker.tsx
// Grid of DiceBear avatars — used in register and profile edit
import { useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

const STYLES = [
  { id: 'miniavs',        label: 'Mini' },
  { id: 'pixel-art',      label: 'Pixel' },
  { id: 'bottts-neutral', label: 'Robot' },
  { id: 'fun-emoji',      label: 'Emoji' },
  { id: 'lorelei',        label: 'Lorelei' },
  { id: 'thumbs',         label: 'Thumbs' },
]

const GRID_SIZE = 12

function randomSeed() {
  return Math.random().toString(36).slice(2, 10)
}

function makeSeeds(n: number) {
  return Array.from({ length: n }, randomSeed)
}

function avatarUrl(seed: string, style: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0e1228`
}

interface AvatarPickerProps {
  initialSeed?: string
  initialStyle?: string
  onSelect: (seed: string, style: string) => void
}

export default function AvatarPicker({ initialSeed, initialStyle = 'miniavs', onSelect }: AvatarPickerProps) {
  const [style, setStyle] = useState(initialStyle)
  const [seeds, setSeeds] = useState<string[]>(() => {
    const base = makeSeeds(GRID_SIZE - 1)
    // Put initialSeed in first slot so it's always visible
    return initialSeed ? [initialSeed, ...base] : makeSeeds(GRID_SIZE)
  })
  const [selected, setSelected] = useState(initialSeed ?? seeds[0])

  const handleSelect = useCallback((seed: string) => {
    setSelected(seed)
    onSelect(seed, style)
  }, [style, onSelect])

  const handleStyleChange = useCallback((newStyle: string) => {
    setStyle(newStyle)
    onSelect(selected, newStyle)
  }, [selected, onSelect])

  const refresh = useCallback(() => {
    const newSeeds = makeSeeds(GRID_SIZE)
    setSeeds(newSeeds)
    // Keep selection on first of new batch
    setSelected(newSeeds[0])
    onSelect(newSeeds[0], style)
  }, [style, onSelect])

  return (
    <div>
      {/* Style tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {STYLES.map(s => (
          <button key={s.id} onClick={() => handleStyleChange(s.id)}
            type="button"
            style={{
              padding: '3px 10px', borderRadius: 2, cursor: 'pointer',
              border: `1px solid ${style === s.id ? 'var(--cyan)' : 'var(--border)'}`,
              background: style === s.id ? 'rgba(0,229,255,.1)' : 'transparent',
              color: style === s.id ? 'var(--cyan)' : 'var(--muted)',
              fontFamily: 'var(--font-ui, Rajdhani, sans-serif)', fontWeight: 600,
              fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em',
              transition: 'all 0.15s',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Avatar grid — 6 columns on mobile, 6 on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 6,
        marginBottom: '0.75rem',
      }}>
        {seeds.map(seed => {
          const isSelected = seed === selected
          return (
            <button key={seed} type="button" onClick={() => handleSelect(seed)}
              style={{
                padding: 3, border: `2px solid ${isSelected ? 'var(--pink)' : 'var(--border)'}`,
                borderRadius: 8, background: 'var(--bg-card)', cursor: 'pointer',
                aspectRatio: '1', overflow: 'hidden',
                boxShadow: isSelected ? '0 0 10px rgba(255,45,135,.5)' : 'none',
                transition: 'all 0.15s',
              }}>
              <img
                src={avatarUrl(seed, style)}
                alt=""
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </button>
          )
        })}
      </div>

      {/* Selected preview + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--bg-card)', border: '2px solid var(--pink)',
          overflow: 'hidden', boxShadow: '0 0 12px rgba(255,45,135,.4)',
          flexShrink: 0,
        }}>
          <img src={avatarUrl(selected, style)} alt="selected" style={{ width: '100%', height: '100%' }} />
        </div>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Selected avatar</div>
          <button type="button" onClick={refresh}
            className="btn btn-cyan btn-sm" style={{ width: 'auto', gap: 6 }}>
            <RefreshCw size={12} /> Generate more
          </button>
        </div>
      </div>
    </div>
  )
}
