// The hotspot graphic for the viewer guide's legend: a static version of the 3D markers
// (src/hotspots/HotspotMarker.tsx) — a brand-blue disc with a white rim, white core and a soft glow.
function PointerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" style={{ overflow: 'visible' }}>
      <circle cx="15" cy="15" r="14" fill="rgba(70, 120, 255, 0.35)" />
      <circle cx="15" cy="15" r="11" fill="#1e4fd8" stroke="#ffffff" strokeWidth="2.5" />
      <circle cx="15" cy="15" r="4" fill="#ffffff" />
    </svg>
  )
}

export default PointerIcon
