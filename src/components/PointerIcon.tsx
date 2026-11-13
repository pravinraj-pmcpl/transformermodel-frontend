// The instrument pointer graphic, shared by the 3D markers and the viewer guide's legend.
// Hotspot style (as in model-viewer / Sketchfab annotations): a solid red disc with a white
// border so it reads on any surface, a white centre dot, and a red halo that pulses outwards to
// draw the eye. overflow: visible lets the halo grow past the icon without changing its size or
// click area.
function PointerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" style={{ overflow: 'visible' }}>
      <circle cx="15" cy="15" r="12" fill="none" stroke="#e53935" strokeWidth="2">
        <animate attributeName="r" values="12;19" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="15" cy="15" r="13" fill="#d32f2f" stroke="#ffffff" strokeWidth="2.5" />
      <circle cx="15" cy="15" r="7" fill="none" stroke="#ffcdd2" strokeWidth="1.5" />
      <circle cx="15" cy="15" r="3.5" fill="#ffffff" />
    </svg>
  )
}

export default PointerIcon
