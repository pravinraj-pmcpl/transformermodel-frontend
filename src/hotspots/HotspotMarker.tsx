import { useState } from 'react'

export const BRAND_BLUE = '#1e4fd8'

const SIGNAL_WAVE_MS = 1800

// Keyframes for every marker; HotspotLayer renders this once per view.
export const HOTSPOT_STYLES = `
@keyframes hotspot-idle-pulse {
  0% { transform: scale(1); opacity: 0.55; }
  70%, 100% { transform: scale(1.9); opacity: 0; }
}
@keyframes hotspot-signal-wave {
  from { transform: scale(1); opacity: 0.9; }
  to { transform: scale(3.2); opacity: 0; }
}`

const ring = {
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  pointerEvents: 'none',
} as const

// Three brand-blue rings expanding out of the marker one after another, looping, while its
// details card is open.
function SignalWaves() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            ...ring,
            border: `2px solid ${BRAND_BLUE}`,
            animation: `hotspot-signal-wave ${SIGNAL_WAVE_MS}ms ease-out ${(i * SIGNAL_WAVE_MS) / 3}ms infinite both`,
          }}
        />
      ))}
    </>
  )
}

const MARKER_SIZE = 16
const CORE_SIZE = 5

// The hotspot itself: a small glowing brand-blue disc with a white rim and white core, a soft
// halo breathing outwards, and a name tag that slides out on hover. Scales up 1.3× while
// hovered or active. Hidden entirely while the model is between it and the camera.
export function HotspotMarker({
  label,
  active,
  occluded,
  onHover,
  onPress,
}: {
  label: string
  active: boolean
  occluded: boolean
  onHover?: () => void
  onPress: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const raised = hovered || active
  return (
    <div
      style={{
        position: 'relative',
        width: MARKER_SIZE,
        height: MARKER_SIZE,
        // Markers on the far side of the model are hidden, not just faded.
        visibility: occluded ? 'hidden' : 'visible',
      }}
    >
      <button
        type="button"
        aria-label={label}
        onClick={onPress}
        // Mouse only: on touch screens a tap is a click, so it isn't handled twice.
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse') return
          setHovered(true)
          onHover?.()
        }}
        // Also on move, so a mouse already resting on the marker when the model unlocks opens
        // it on its next movement (pointerenter won't fire again until it leaves).
        onPointerMove={(e) => e.pointerType === 'mouse' && onHover?.()}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        style={{
          position: 'relative',
          width: MARKER_SIZE,
          height: MARKER_SIZE,
          padding: 0,
          border: '2px solid #fff',
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, #5b86ff, ${BRAND_BLUE} 70%)`,
          cursor: 'pointer',
          boxShadow: `0 0 0 2px rgba(30, 79, 216, 0.35), 0 0 10px rgba(70, 120, 255, ${raised ? 0.95 : 0.7})`,
          transform: `scale(${raised ? 1.3 : 1})`,
          transition: 'transform 250ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 250ms ease',
        }}
      >
        {!active && (
          <span
            aria-hidden="true"
            style={{
              ...ring,
              inset: -2,
              background: 'rgba(70, 120, 255, 0.55)',
              animation: 'hotspot-idle-pulse 2.4s ease-out infinite',
            }}
          />
        )}
        {active && <SignalWaves />}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: CORE_SIZE,
            height: CORE_SIZE,
            margin: -CORE_SIZE / 2,
            borderRadius: '50%',
            background: '#fff',
          }}
        />
      </button>
      {/* Name tag, sliding out to the right of the marker. */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: MARKER_SIZE + 12,
          top: '50%',
          padding: '5px 10px',
          borderRadius: 6,
          background: 'rgba(15, 25, 45, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#fff',
          font: '600 12px/1.2 Inter, system-ui, sans-serif',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: raised ? 1 : 0,
          transform: `translate(${raised ? 0 : -8}px, -50%)`,
          transition: 'opacity 200ms ease, transform 250ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {label}
      </span>
    </div>
  )
}
