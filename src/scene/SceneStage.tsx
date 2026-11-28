import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { DirectionalLight } from 'three'
import { Bounds, Center, Environment, useBounds } from '@react-three/drei'

// Replaces drei's <Stage>. Keeps what Stage did for us (centre the model, fit the camera to it)
// but swaps its generic studio lights for a sunset scene that
// matches the background photo: a warm low sun with real shadows plus a sunset HDRI for fill
// light and reflections.

export type SunSide = 'transformer' | 'panel'

// Direction the sunlight comes from, per view, as seen from the view's starting camera: from
// the upper left and slightly in front, like the low sun on the left of the background photo.
// The transformer view starts looking along +Z and the panels along -Z, so they mirror.
const SUN_DIRECTION: Record<SunSide, [number, number, number]> = {
  transformer: [0.7, 0.6, -0.45],
  panel: [-0.6, 0.7, 0.5],
}
const SUN_COLOR = '#ffd3a1'
const SUN_INTENSITY = 2.4
const SHADOW_MAP_SIZE = 2048

function Sun({ radius, side }: { radius: number; side: SunSide }) {
  const ref = useRef<DirectionalLight>(null!)
  const [x, y, z] = SUN_DIRECTION[side]
  const distance = radius * 2

  // Fit the shadow camera tightly around the model so the 2048 map isn't spent on empty space.
  useLayoutEffect(() => {
    const camera = ref.current.shadow.camera
    camera.left = -radius
    camera.right = radius
    camera.top = radius
    camera.bottom = -radius
    camera.near = 0.1
    camera.far = distance * 2
    camera.updateProjectionMatrix()
  }, [radius, distance])

  return (
    <directionalLight
      ref={ref}
      position={[x * distance, y * distance, z * distance]}
      color={SUN_COLOR}
      intensity={SUN_INTENSITY}
      castShadow
      shadow-mapSize={[SHADOW_MAP_SIZE, SHADOW_MAP_SIZE]}
      // PCF blur radius in texels: softens the shadow edges like a sun near the horizon.
      shadow-radius={4}
      shadow-bias={-0.0004}
      // Scaled with the model so large flat surfaces (tank walls, plinth) don't show acne.
      shadow-normalBias={radius * 0.002}
    />
  )
}

function Refit({ radius, adjustCamera }: { radius: number; adjustCamera: number }) {
  const api = useBounds()
  useEffect(() => {
    if (adjustCamera) api.refresh().clip().fit()
    // Same trigger as drei's Stage: refit once the model has been measured.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, adjustCamera])
  return null
}

export function SceneStage({
  children,
  adjustCamera,
  sunSide,
}: {
  children: ReactNode
  // Margin around the model when fitting the camera (as Stage's adjustCamera).
  adjustCamera: number
  sunSide: SunSide
}) {
  const [radius, setRadius] = useState(0)
  const onCentered = useCallback(
    ({ boundingSphere }: { boundingSphere: { radius: number } }) => setRadius(boundingSphere.radius),
    [],
  )

  return (
    <>
      {/* Sunset HDRI: image-based fill light and reflections only; the photo stays the
          visible background. */}
      <Environment preset="sunset" environmentIntensity={0.65} />
      {/* Warm sky above, dark ground below: lifts the shadowed sides without flattening them. */}
      <hemisphereLight args={['#ffe3c7', '#3d4148', 0.3]} />
      {radius > 0 && <Sun radius={radius} side={sunSide} />}
      <Bounds fit clip observe margin={adjustCamera}>
        <Refit radius={radius} adjustCamera={adjustCamera} />
        <Center onCentered={onCentered}>{children}</Center>
      </Bounds>
      {/* No contact shadow under the model: the canvas is transparent over the background
          photo, so its large blurred plane showed as a dark smear on the photo's ground around
          the plinth. The sun's own shadows on the plinth ground the model instead. */}
    </>
  )
}
