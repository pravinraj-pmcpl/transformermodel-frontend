import { createRef, useContext, useMemo, useRef, useState, type RefObject } from 'react'
import { Vector3, type Group, type Mesh, type Object3D } from 'three'
import { Html } from '@react-three/drei'
import { VIEWS, type HotspotData, type View } from '../data/hotspots'
import { HotspotMarker } from './HotspotMarker'
import { ActiveHotspotContext, MarkersLockedContext } from './state'

function Hotspot({
  hotspot,
  occluders,
  onActivate,
}: {
  hotspot: HotspotData
  occluders: RefObject<Mesh | null>[]
  onActivate: (hotspot: HotspotData, worldAnchor: Vector3) => void
}) {
  const locked = useContext(MarkersLockedContext)
  const activeId = useContext(ActiveHotspotContext)
  const anchorRef = useRef<Group>(null)
  const [occluded, setOccluded] = useState(false)

  const activate = () => {
    if (locked || !anchorRef.current) return
    onActivate(hotspot, anchorRef.current.getWorldPosition(new Vector3()))
  }

  return (
    <group ref={anchorRef} position={hotspot.anchor}>
      <Html
        center
        occlude={occluders.length ? (occluders as RefObject<Object3D>[]) : undefined}
        // With onOcclude set, drei leaves hiding the marker to us (HotspotMarker hides it
        // via visibility, so its hover state and name tag survive the round trip).
        onOcclude={setOccluded}
      >
        <HotspotMarker
          label={hotspot.label ?? hotspot.tag}
          active={activeId === hotspot.id}
          occluded={occluded}
          // Instruments open on hover; view-switch hotspots only on click.
          onHover={hotspot.opensView ? undefined : activate}
          onPress={activate}
        />
      </Html>
    </group>
  )
}

// A view's hotspots and their invisible occluder boxes, all from hotspots.json. Render it inside
// the model's group so anchors share the model's coordinates.
export function HotspotLayer({
  view,
  onActivate,
}: {
  view: View
  onActivate: (hotspot: HotspotData, worldAnchor: Vector3) => void
}) {
  const data = VIEWS[view]
  const occluderRefs = useMemo(
    () => Object.fromEntries(Object.keys(data.occluders).map((id) => [id, createRef<Mesh>()])),
    [data],
  )

  return (
    <>
      {Object.entries(data.occluders).map(([id, { position, size }]) => (
        <mesh key={id} ref={occluderRefs[id]} position={position} visible={false}>
          <boxGeometry args={size} />
        </mesh>
      ))}
      {data.hotspots.map((hotspot) => (
        <Hotspot
          key={hotspot.id}
          hotspot={hotspot}
          occluders={(hotspot.occluders ?? []).map((id) => occluderRefs[id])}
          onActivate={onActivate}
        />
      ))}
    </>
  )
}
