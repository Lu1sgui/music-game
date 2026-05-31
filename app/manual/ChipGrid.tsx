'use client'
// app/manual/ChipGrid.tsx — chip compendium as an icon grid with hover details.
import { useState } from 'react'
import ChipIcon from '../components/ChipIcon'
import type { ManualChip } from './manualData'

const KIND_COLOR: Record<ManualChip['kind'], string> = {
  Self: 'var(--cyan)', Offensive: 'var(--pink)', Defense: 'var(--green)', Utility: 'var(--yellow)', Meta: '#FF8A00',
}

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export default function ChipGrid({ groups }: { groups: { rarity: string; color: string; chips: ManualChip[] }[] }) {
  const [active, setActive] = useState<string | null>(null)

  return (
    <div>
      {groups.map((group) => (
        <div key={group.rarity} style={{ marginBottom: '1.75rem' }}>
          <div className="font-pixel" style={{ fontSize: 10, color: group.color, margin: '0.5rem 0 0.9rem', letterSpacing: 1 }}>◆ {group.rarity}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(86px, 1fr))', gap: 8 }}>
            {group.chips.map((c) => {
              const slug = slugify(c.name)
              const isOn = active === slug
              return (
                <div
                  key={slug}
                  onMouseEnter={() => setActive(slug)}
                  onMouseLeave={() => setActive((s) => (s === slug ? null : s))}
                  onClick={() => setActive((s) => (s === slug ? null : slug))}
                  style={{
                    position: 'relative', cursor: 'pointer',
                    background: 'var(--bg-card)', border: `1px solid ${isOn ? group.color : 'var(--border)'}`,
                    borderRadius: 6, padding: '0.7rem 0.4rem', textAlign: 'center',
                    transition: 'border-color .15s, transform .15s', transform: isOn ? 'translateY(-2px)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                    <ChipIcon slug={slug} size={32} />
                  </div>
                  <div className="font-ui" style={{ fontSize: '0.72rem', lineHeight: 1.15, color: 'var(--text)' }}>{c.name}</div>

                  {/* Hover / tap details */}
                  {isOn && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                        width: 220, zIndex: 50, textAlign: 'left',
                        background: 'var(--bg)', border: `2px solid ${group.color}`, borderRadius: 6,
                        padding: '0.7rem 0.8rem', boxShadow: '0 8px 24px rgba(0,0,0,.55)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <ChipIcon slug={slug} size={20} />
                        <span className="font-ui" style={{ fontSize: '0.9rem' }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: '0.64rem', color: KIND_COLOR[c.kind], border: `1px solid ${KIND_COLOR[c.kind]}`, borderRadius: 3, padding: '1px 6px' }}>
                        {c.kind} · {c.when}
                      </span>
                      <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 6, lineHeight: 1.45 }}>{c.effect}</div>
                      {c.counters && <div style={{ fontSize: '0.7rem', color: 'var(--green)', marginTop: 5 }}>Countered by: {c.counters}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Hover a chip (or tap on mobile) to see what it does.</p>
    </div>
  )
}
