import { createContext } from 'react'
import type { Mesh, Object3D } from 'three'

// True while a details card is open: every marker ignores hover and clicks until it closes.
export const MarkersLockedContext = createContext(false)
// Id of the hotspot whose card is open; it shows the signal waves.
export const ActiveHotspotContext = createContext<string | null>(null)

// Every mesh under the nodes whose names match `pattern` (a hotspot's "parts").
export function findParts(scene: Object3D, pattern?: string): Object3D[] {
  if (!pattern) return []
  const regex = new RegExp(pattern)
  const meshes = new Set<Object3D>()
  scene.traverse((node) => {
    if (regex.test(node.name)) node.traverse((child) => (child as Mesh).isMesh && meshes.add(child))
  })
  return [...meshes]
}
