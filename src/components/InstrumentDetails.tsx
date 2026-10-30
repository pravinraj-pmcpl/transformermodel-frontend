import { useEffect, useState } from 'react'
import type { InstrumentInfo, Specification } from '../instruments'

// Where each row starts in the typing sequence (label, then value, row after row);
// the last entry is the total character count.
function rowOffsets(specifications: Specification[]) {
  return specifications.reduce<number[]>(
    (offsets, spec, i) => [...offsets, offsets[i] + spec.label.length + spec.value.length],
    [0],
  )
}

const TYPING_INTERVAL_MS = 20
const CHARS_PER_TICK = 1
const SLIDE_MS = 900

// Slides in from (and back out to) the right edge of the screen.
const ANIMATIONS = `
@keyframes instrument-details-in {
  from { opacity: 0; transform: translateX(calc(100% + 32px)); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes instrument-details-out {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(calc(100% + 32px)); }
}
@keyframes instrument-details-caret {
  50% { opacity: 0; }
}
`

/** Reveals the specification table character by character, like it's being typed. */
function useTypedCount(total: number) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => {
        const next = Math.min(c + CHARS_PER_TICK, total)
        if (next === total) clearInterval(id)
        return next
      })
    }, TYPING_INTERVAL_MS)
    return () => clearInterval(id)
  }, [total])
  return count
}

function Caret() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: '1em',
        marginLeft: 1,
        verticalAlign: 'text-bottom',
        background: '#2f6bff',
        animation: 'instrument-details-caret 0.8s step-end infinite',
      }}
    />
  )
}

// Remount (via `key`) to restart the typing for a different instrument.
function InstrumentDetails({
  instrument,
  tag,
  onClose,
}: {
  instrument: InstrumentInfo
  tag: string
  onClose: () => void
}) {
  const offsets = rowOffsets(instrument.specifications)
  const typed = useTypedCount(offsets[instrument.specifications.length])
  const [closing, setClosing] = useState(false)

  return (
    <div
      // After the slide-out finishes, let the parent unmount the panel.
      onAnimationEnd={(e) => {
        if (closing && e.animationName === 'instrument-details-out') onClose()
      }}
      style={{
        position: 'absolute',
        top: 160,
        right: 32,
        bottom: 24,
        zIndex: 5,
        width: 420,
        maxWidth: 'calc(100vw - 64px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 14,
        // Same glass look as the Transformer Viewer guide panel.
        background: 'rgba(24, 27, 34, 0.72)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(6px)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
        animation: closing
          ? `instrument-details-out ${SLIDE_MS}ms cubic-bezier(0.55, 0, 1, 0.45) forwards`
          : `instrument-details-in ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      <style>{ANIMATIONS}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          padding: '16px 20px 12px',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            {instrument.title}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{tag}</div>
        </div>
        <button
          type="button"
          onClick={() => setClosing(true)}
          aria-label="Close"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 20,
            lineHeight: 1,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ overflowY: 'auto', padding: '0 20px 20px' }}>
        <img
          src={instrument.imageUrl}
          alt={instrument.title}
          style={{
            display: 'block',
            width: '100%',
            height: 200,
            objectFit: 'contain',
            borderRadius: 10,
            background: '#fff',
          }}
        />

        <div style={{ fontSize: 12, fontWeight: 700, color: '#6f9bff', margin: '16px 0 8px' }}>
          {instrument.specificationsHeading}
        </div>
        <div style={{ fontSize: 12 }}>
          {instrument.specifications.map((spec, i) => {
            const rowTyped = typed - offsets[i]
            const label = spec.label.slice(0, Math.max(rowTyped, 0))
            const value = spec.value.slice(0, Math.max(rowTyped - spec.label.length, 0))
            if (!label) return null
            // Typing runs in order, so only the last visible row can be incomplete.
            const typingLabel = label.length < spec.label.length
            const typingValue = !typingLabel && value.length < spec.value.length
            return (
              <div
                key={spec.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '42% 1fr',
                  gap: 12,
                  padding: '6px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span style={{ color: '#9ca3af' }}>
                  {label}
                  {typingLabel && <Caret />}
                </span>
                <span style={{ fontWeight: 500 }}>
                  {value}
                  {typingValue && <Caret />}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default InstrumentDetails
