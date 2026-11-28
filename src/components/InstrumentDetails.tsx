import { useEffect, useState, type CSSProperties } from 'react'
import type { InstrumentInfo, Specification } from '../instruments'
import { BRAND_BLUE } from '../hotspots/HotspotMarker'

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
// Content blocks appear one after another, starting halfway through the slide-in.
const STAGGER_START_MS = SLIDE_MS / 2
const STAGGER_STEP_MS = 90

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
@keyframes instrument-details-block-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.details-action { transition: transform 200ms ease, box-shadow 200ms ease; }
.details-action:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(30, 79, 216, 0.45); }
.details-action:active { transform: scale(0.96); }
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

function blockIn(step: number): CSSProperties {
  return {
    animation: `instrument-details-block-in 450ms cubic-bezier(0.22, 1, 0.36, 1) ${
      STAGGER_START_MS + step * STAGGER_STEP_MS
    }ms both`,
  }
}

const sectionHeading: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: '#8fb0ff',
  margin: '18px 0 10px',
}

const imageStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: 200,
  objectFit: 'contain',
  borderRadius: 10,
  background: '#fff',
}

// Glass side panel for one instrument: slides in from the right, then its content arrives in
// order — actions, product images, specifications. ✕ or Esc closes it. Remount (via `key`) for
// each opening.
function InstrumentDetails({
  instrument,
  tag,
  number,
  onCloseStart,
  onClose,
}: {
  instrument: InstrumentInfo
  tag: string
  number?: number
  // Called as soon as closing starts (✕ or Esc), before the slide-out animation.
  onCloseStart?: () => void
  onClose: () => void
}) {
  const specifications = instrument.specifications ?? []
  const offsets = rowOffsets(specifications)
  const typed = useTypedCount(offsets[specifications.length])
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (closing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setClosing(true)
      onCloseStart?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closing, onCloseStart])

  let step = 0
  const hasActions = !!(instrument.datasheetUrl || instrument.enquiryUrl)

  return (
    <div
      role="dialog"
      aria-label={`${instrument.title} – ${tag}`}
      // After the slide-out finishes, let the parent unmount the panel.
      onAnimationEnd={(e) => {
        if (closing && e.animationName === 'instrument-details-out') onClose()
      }}
      style={{
        position: 'absolute',
        top: 160,
        right: 32,
        bottom: 24,
        zIndex: 21,
        width: 420,
        maxWidth: 'calc(100vw - 64px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 12,
        background: 'rgba(15, 25, 45, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
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
          gap: 12,
          padding: '16px 20px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {number !== undefined && (
          <span
            style={{
              flex: 'none',
              display: 'grid',
              placeItems: 'center',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: BRAND_BLUE,
              border: '2px solid #fff',
              fontSize: 12,
              fontWeight: 700,
              boxShadow: '0 0 12px rgba(70, 120, 255, 0.7)',
            }}
          >
            {number}
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            {instrument.title}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{tag}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            setClosing(true)
            onCloseStart?.()
          }}
          aria-label="Close (Esc)"
          title="Close (Esc)"
          style={{
            flex: 'none',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#fff',
            fontSize: 18,
            lineHeight: 1,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ overflowY: 'auto', padding: '4px 20px 20px' }}>
        {hasActions && (
          <div style={{ display: 'flex', gap: 10, marginTop: 18, ...blockIn(step++) }}>
            {instrument.datasheetUrl && (
              <a
                className="details-action"
                href={instrument.datasheetUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: BRAND_BLUE,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Download Datasheet
              </a>
            )}
            {instrument.enquiryUrl && (
              <a
                className="details-action"
                href={instrument.enquiryUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Enquire Now
              </a>
            )}
          </div>
        )}

        {instrument.imageUrl && (
          <img src={instrument.imageUrl} alt={instrument.title} style={{ ...imageStyle, marginTop: 18, ...blockIn(step++) }} />
        )}

        {instrument.gallery && (
          <>
            <div style={{ ...sectionHeading, ...blockIn(step) }}>Products</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              {instrument.gallery.map((item, i) => (
                <figure key={item.imageUrl} style={{ margin: 0, ...blockIn(step + i * 0.7) }}>
                  <img src={item.imageUrl} alt={item.name} loading="lazy" style={imageStyle} />
                  <figcaption
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      textAlign: 'center',
                      marginTop: 6,
                      lineHeight: 1.35,
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        )}

        {instrument.specificationsHeading && (
          <div style={sectionHeading}>{instrument.specificationsHeading}</div>
        )}
        <div style={{ fontSize: 12 }}>
          {specifications.map((spec, i) => {
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
