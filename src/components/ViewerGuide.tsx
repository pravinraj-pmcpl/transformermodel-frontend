interface GuideItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
}

const MOUSE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="6" y="3" width="12" height="18" rx="6" />
    <line x1="12" y1="7" x2="12" y2="11" />
  </svg>
)

const TARGET_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <line x1="12" y1="1.5" x2="12" y2="4.5" />
    <line x1="12" y1="19.5" x2="12" y2="22.5" />
    <line x1="1.5" y1="12" x2="4.5" y2="12" />
    <line x1="19.5" y1="12" x2="22.5" y2="12" />
  </svg>
)

// Open hand, as on Blender's "Move the view" button.
const HAND_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-4 0v5" />
    <path d="M14 10V4a2 2 0 0 0-4 0v6" />
    <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
)

const GUIDE_ITEMS: GuideItem[] = [
  { id: 'drag', label: 'Drag', description: 'Rotate left / right', icon: MOUSE_ICON },
  { id: 'scroll', label: 'Scroll', description: 'Zoom', icon: MOUSE_ICON },
  { id: 'click', label: 'Click on Points', description: 'View Details', icon: TARGET_ICON },
  { id: 'right-drag', label: 'Right Drag', description: 'Move the view', icon: HAND_ICON },
]

function ViewerGuide() {
  return (
    <div
      style={{
        position: 'absolute',
        left: 32,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 5,
        width: 240,
        padding: 20,
        borderRadius: 14,
        background: 'rgba(24, 27, 34, 0.72)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(6px)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
        Transformer Viewer
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 18 }}>Interactive 3D Model</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {GUIDE_ITEMS.map((item) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ViewerGuide
