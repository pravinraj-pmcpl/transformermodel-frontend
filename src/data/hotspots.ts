import data from './hotspots.json'

// Typed access to hotspots.json. Everything about a view's hotspots lives in that file, so an
// instrument can be added, moved or renumbered without touching code (see README).

export type View = 'transformer' | 'fcc' | 'rtcc'
export type Vec3 = [number, number, number]

export interface HotspotData {
  id: string
  tag: string
  // Where the marker sits, in the model's own coordinates (as exported from Blender).
  anchor: Vec3
  // Key into GALLERIES (src/instruments.ts): what the details card shows.
  info?: string
  // Regular expression on GLB node names: every matching node (and its children) is outlined
  // while this hotspot's card is open.
  parts?: string
  // Ids from the view's "occluders": the marker fades while any of them hides it.
  occluders?: string[]
  // Set on hotspots that switch to another view on click instead of opening a card.
  opensView?: View
  // Tooltip text; defaults to the tag.
  label?: string
  // Camera distance for the fly-to close-up; defaults to the view's focusDistance.
  focusDistance?: number
}

export interface Occluder {
  position: Vec3
  size: Vec3
}

export interface ViewData {
  focusDistance: number
  // Invisible boxes standing in for the model's bulk, cheap to raycast: a marker fades while
  // one of its occluders sits between it and the camera.
  occluders: Record<string, Occluder>
  hotspots: HotspotData[]
}

export const VIEWS = data as unknown as Record<View, ViewData>

// Instrument hotspots are numbered 1, 2, 3… in file order; view-switch hotspots aren't.
export function hotspotNumbers(view: View): Map<string, number> {
  const numbers = new Map<string, number>()
  VIEWS[view].hotspots.filter((h) => !h.opensView).forEach((h, i) => numbers.set(h.id, i + 1))
  return numbers
}
