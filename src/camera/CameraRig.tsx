import { useEffect, useRef, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { PerspectiveCamera, QuadraticBezierCurve3, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

// Width of the details card plus its gap to the screen edge (InstrumentDetails: 420 + 32).
// The close-up is framed in the space left of it.
const DETAILS_INSET_PX = 452
const FLY_SECONDS = 1.4
// Close-ups are taken from between these elevations (radians above horizontal), so the camera
// never ends up level with the plinth or straight overhead.
const MIN_ELEVATION = 0.2
const MAX_ELEVATION = 0.75

interface Pose {
  position: Vector3
  target: Vector3
}

const UP = new Vector3(0, 1, 0)

// Where to put the camera to frame `focus`: `distance` away, on the side the user is already
// looking from (the marker was visible from there, so the way in is clear), at a comfortable
// elevation, and nudged sideways so the part sits in the middle of the area the card leaves.
function closeUp(camera: PerspectiveCamera, viewportWidth: number, focus: Vector3, distance: number): Pose {
  const toCamera = camera.position.clone().sub(focus)
  const flat = new Vector3(toCamera.x, 0, toCamera.z)
  if (flat.lengthSq() < 1e-6) flat.set(0, 0, -1)
  flat.normalize()
  const elevation = Math.min(
    Math.max(Math.atan2(toCamera.y, Math.hypot(toCamera.x, toCamera.z)), MIN_ELEVATION),
    MAX_ELEVATION,
  )
  const direction = flat.multiplyScalar(Math.cos(elevation)).setY(Math.sin(elevation))

  const target = focus.clone()
  const position = focus.clone().addScaledVector(direction, distance)
  // On narrow screens the card covers nearly everything, so there's no free area to centre in.
  if (viewportWidth > 900) {
    const halfWidth = distance * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect
    const shift = (DETAILS_INSET_PX / 2 / (viewportWidth / 2)) * halfWidth
    const right = new Vector3().crossVectors(direction.clone().negate(), UP).normalize()
    target.addScaledVector(right, shift)
    position.addScaledVector(right, shift)
  }
  return { position, target }
}

interface Away {
  // The pose to return to, kept across back-to-back close-ups so "back" always goes home.
  home: Pose
  // The user's tilt lock, lifted while away because close-ups look down on instruments from a
  // little higher than the user may tilt.
  minPolarAngle: number
}

// Back home: give the user their tilt lock and the controls again.
function arrive(orbit: OrbitControlsImpl, away: RefObject<Away | null>) {
  if (!away.current) return
  orbit.minPolarAngle = away.current.minPolarAngle
  orbit.enabled = true
  away.current = null
}

// Flies the camera to a close-up of `focus` when it is set, and back to where it was when it is
// cleared. The flight follows a curve that arcs upwards between the two poses, easing in and
// out (expo.inOut), with the orbit target gliding along with it.
export function CameraRig({ focus, distance }: { focus: Vector3 | null; distance: number }) {
  // The camera and controls are read through get() inside effects: they are three.js objects
  // this component drives directly, which React state rules don't allow on hook return values.
  const get = useThree((state) => state.get)
  const hasControls = useThree((state) => state.controls !== null)
  // Set while the camera is away from where the user left it (in a close-up, or flying back).
  const away = useRef<Away | null>(null)
  const tween = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const { camera: cam, controls: ctrl, size } = get()
    if (!ctrl) return
    const camera = cam as PerspectiveCamera
    const controls = ctrl as unknown as OrbitControlsImpl
    const fly = (to: Pose, onComplete?: () => void) => {
      tween.current?.kill()
      const fromPosition = camera.position.clone()
      const fromTarget = controls.target.clone()
      const lift = fromPosition.distanceTo(to.position) * 0.25
      const curve = new QuadraticBezierCurve3(
        fromPosition,
        fromPosition.clone().lerp(to.position, 0.5).addScaledVector(UP, lift),
        to.position,
      )
      const progress = { t: 0 }
      tween.current = gsap.to(progress, {
        t: 1,
        duration: FLY_SECONDS,
        ease: 'expo.inOut',
        onUpdate: () => {
          curve.getPoint(progress.t, camera.position)
          controls.target.lerpVectors(fromTarget, to.target, progress.t)
          // The controls are disabled during flights and skip their own update.
          controls.update()
        },
        onComplete,
      })
    }

    if (focus) {
      if (!away.current) {
        away.current = {
          home: { position: camera.position.clone(), target: controls.target.clone() },
          minPolarAngle: controls.minPolarAngle,
        }
        controls.minPolarAngle = 0
      }
      fly(closeUp(camera, size.width, focus, distance))
    } else if (away.current) {
      // The card has closed and App re-enabled the controls; keep them off until the camera is
      // home, so a drag can't start from the close-up's tilt and get snapped back level.
      controls.enabled = false
      fly(away.current.home, () => arrive(controls, away))
    }
    // Re-run only when the focus changes (a resize mid-close-up shouldn't re-fly), or once the
    // controls exist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, hasControls])

  // Switching views unmounts the rig mid-flight: stop, and hand back the lock and controls.
  useEffect(
    () => () => {
      tween.current?.kill()
      const controls = get().controls as unknown as OrbitControlsImpl | null
      if (controls) arrive(controls, away)
    },
    [get],
  )
  return null
}
