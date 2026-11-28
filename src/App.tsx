import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LoopRepeat, PCFShadowMap, type Object3D, type Vector3 } from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useAnimations, useGLTF } from '@react-three/drei'
import modelUrl from './assets/transformer/3D/transformer.glb'
import rtccPanelUrl from './assets/rtcc/3D/RTCC_Panel.glb'
import fccPanelUrl from './assets/fcc/3D/FCC_Panel.glb'
import backgroundUrl from './assets/backgroundimage1.png'
import { CameraRig } from './camera/CameraRig'
import Header from './components/Header'
import InstrumentDetails from './components/InstrumentDetails'
import ViewerGuide from './components/ViewerGuide'
import { hotspotNumbers, VIEWS, type HotspotData, type View } from './data/hotspots'
import { HotspotLayer } from './hotspots/HotspotLayer'
import { ActiveHotspotContext, findParts, MarkersLockedContext } from './hotspots/state'
import { HOTSPOT_STYLES } from './hotspots/HotspotMarker'
import { GALLERIES, type InstrumentInfo } from './instruments'
import { prepareModel } from './scene/materials'
import { PostFX } from './scene/PostFX'
import { SceneStage } from './scene/SceneStage'

interface ModelConfig {
  url: string
  // Animation clip looped while the view is shown.
  clip?: string
  // Margin around the model when the camera fits it.
  fitMargin: number
  // How close the user can zoom in.
  minDistance: number
}

const MODELS: Record<View, ModelConfig> = {
  // The GLB's only clip spins all 12 cooler fan blade sets.
  transformer: { url: modelUrl, clip: 'Cooler_Fans_Spin', fitMargin: 0.75, minDistance: 1 },
  // Its only clip moves the dial pointers of the temperature indicators. The panel can be
  // zoomed right up to its instruments.
  fcc: { url: fccPanelUrl, clip: 'Instrument_Pointers', fitMargin: 0.9, minDistance: 0.05 },
  rtcc: { url: rtccPanelUrl, fitMargin: 0.9, minDistance: 0.2 },
}

// The open details card: which hotspot, what it shows, and what the camera and outline need.
interface Card {
  key: number
  hotspot: HotspotData
  info: InstrumentInfo
  number?: number
  // The marker's position in world space: the camera flies to a close-up of it.
  anchor: Vector3
  // The instrument's meshes, outlined while the card is open.
  parts: Object3D[]
}

function ModelView({
  view,
  onActivate,
  onOpenView,
}: {
  view: View
  onActivate: (hotspot: HotspotData, anchor: Vector3, parts: Object3D[]) => void
  onOpenView: (view: View) => void
}) {
  const { url, clip } = MODELS[view]
  const { scene, animations } = useGLTF(url)
  const { actions } = useAnimations(animations, scene)

  // transformer.glb includes the Blender studio floor (a 400 × 400 m plane), which would make
  // the camera fit frame the transformer as a speck. Drop it before SceneStage measures: this
  // layout effect runs before the stage's own (parent effects run after their children's), and
  // removing it from the cached scene is a no-op on later mounts. Then set up materials and
  // shadows (also once per cached scene).
  useLayoutEffect(() => {
    scene.getObjectByName('Studio_Floor_Studio_Floor')?.removeFromParent()
    prepareModel(scene)
  }, [scene])

  useEffect(() => {
    if (clip) actions[clip]?.reset().setLoop(LoopRepeat, Infinity).play()
  }, [actions, clip])

  return (
    <group>
      <primitive object={scene} />
      <HotspotLayer
        view={view}
        onActivate={(hotspot, anchor) =>
          hotspot.opensView ? onOpenView(hotspot.opensView) : onActivate(hotspot, anchor, findParts(scene, hotspot.parts))
        }
      />
    </group>
  )
}

// Start each view facing the model's front: the transformer's FCC side is -Z, while the
// FCC and RTCC panels' doors face +Z. The stage then fits the distance along this direction.
function ResetCamera({ view }: { view: View }) {
  const camera = useThree((state) => state.camera)
  useLayoutEffect(() => {
    camera.position.set(0, 0, view === 'transformer' ? -5 : 5)
  }, [camera, view])
  return null
}

// The FCC panel can be zoomed right up to its instruments. The stage sets the camera's near
// plane to 1/100 of its fitting distance (and again on every resize), which would slice the
// instruments off when that close, so hold a smaller near plane while this is mounted.
const FCC_CAMERA_NEAR = 0.01

function KeepCameraNear({ near }: { near: number }) {
  useFrame(({ camera }) => {
    if (camera.near !== near) {
      camera.near = near
      camera.updateProjectionMatrix()
    }
  })
  return null
}

useGLTF.preload(fccPanelUrl)
useGLTF.preload(rtccPanelUrl)

const AUTO_ROTATE_RESUME_MS = 10000
// The user can't tilt the camera: it stays 5° above horizontal and only rotates left/right.
// (CameraRig lifts this lock during its close-up flights, which look at instruments from a
// little higher, and restores it once back.)
const POLAR_ANGLE = (85 * Math.PI) / 180

function App() {
  const [view, setView] = useState<View>('transformer')
  const [autoRotate, setAutoRotate] = useState(true)
  // What the details card shows. Kept while it slides out after closing.
  const [card, setCard] = useState<Card | null>(null)
  // The card counts as closed the moment ✕/Esc is pressed, even though it keeps sliding out
  // for a while after: the lock, waves, outline and camera all follow this, so a hover made
  // during the slide-out works (pointerenter won't fire again for a marker already under the
  // mouse).
  const [cardOpen, setCardOpen] = useState(false)
  // Bumped on every open and used as the card's key, so each open mounts a fresh card (reusing
  // one that was still sliding out made it vanish with the model left locked).
  const cardKey = useRef(0)
  const active = cardOpen ? card : null

  const openCard = (hotspot: HotspotData, anchor: Vector3, parts: Object3D[]) => {
    const info = hotspot.info ? GALLERIES[hotspot.info] : undefined
    if (!info) return
    cardKey.current += 1
    setCard({ key: cardKey.current, hotspot, info, number: hotspotNumbers(view).get(hotspot.id), anchor, parts })
    setCardOpen(true)
  }
  const showView = (next: View) => {
    setCard(null)
    setCardOpen(false)
    setView(next)
  }

  const resumeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pauseAutoRotate = () => {
    clearTimeout(resumeTimer.current)
    setAutoRotate(false)
  }
  const scheduleAutoRotate = () => {
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setAutoRotate(true), AUTO_ROTATE_RESUME_MS)
  }
  useEffect(() => () => clearTimeout(resumeTimer.current), [])

  const model = MODELS[view]

  // overflow: hidden clips overlays that animate past the viewport edge (e.g. the
  // instrument details sliding in from the right) so they can't add page scrollbars.
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{HOTSPOT_STYLES}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.6)',
        }}
      />
      {/* zIndex 0 makes the canvas its own stacking context, so the markers drei's <Html>
          renders (with very large z-indexes) stay below the overlays drawn after it.
          Shadows use PCF with a blur radius (three r185 deprecated PCFSoftShadowMap; PCF now
          softens by shadow.radius). Pixel ratio is capped at 2. Antialiasing comes from the
          post-processing composer's MSAA, so the canvas skips its own. */}
      <Canvas
        style={{ position: 'relative', zIndex: 0 }}
        camera={{ position: [0, 0, -5], fov: 30 }}
        shadows={{ enabled: true, type: PCFShadowMap }}
        dpr={[1, 2]}
        gl={{ antialias: false }}
      >
        <ResetCamera view={view} />
        {view === 'fcc' && <KeepCameraNear near={FCC_CAMERA_NEAR} />}
        <MarkersLockedContext.Provider value={cardOpen}>
          <ActiveHotspotContext.Provider value={active?.hotspot.id ?? null}>
            <Suspense fallback={null}>
              {/* Keyed by view so the stage remounts and re-fits the camera to the new model. */}
              <SceneStage
                key={view}
                adjustCamera={model.fitMargin}
                sunSide={view === 'transformer' ? 'transformer' : 'panel'}
              >
                <ModelView view={view} onActivate={openCard} onOpenView={showView} />
              </SceneStage>
            </Suspense>
          </ActiveHotspotContext.Provider>
        </MarkersLockedContext.Provider>
        <PostFX highlight={active?.parts ?? []} />
        {/* makeDefault lets the stage fit the camera to the whole model; no maxDistance cap
            so the camera isn't clamped back inside large models. Right-drag moves the view
            (like Blender's hand tool). Damping (drei's default 0.05) smooths every move. */}
        <OrbitControls
          makeDefault
          // Locked while a details card is open; the user can move the model again once it closes.
          enabled={!cardOpen}
          minDistance={model.minDistance}
          minPolarAngle={POLAR_ANGLE}
          maxPolarAngle={POLAR_ANGLE}
          // Spin clockwise (seen from above); pause while the user drags or zooms and
          // resume after they've been idle for AUTO_ROTATE_RESUME_MS.
          // The FCC and RTCC panels stay still, facing front. The transformer also holds
          // still while a details card is open.
          autoRotate={autoRotate && view === 'transformer' && !cardOpen}
          autoRotateSpeed={-2}
          onStart={pauseAutoRotate}
          onEnd={scheduleAutoRotate}
        />
        {/* Keyed by view so a flight in progress never carries over to another model. */}
        <CameraRig
          key={view}
          focus={active?.anchor ?? null}
          distance={active?.hotspot.focusDistance ?? VIEWS[view].focusDistance}
        />
      </Canvas>
      {/* Dims the screen edges only while a card is open, so the close-up stands out; none
          otherwise (an always-on vignette read as black patches on the photo's ground). Done
          in CSS because the canvas is transparent over the photo. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 40% 50%, transparent 45%, rgba(5, 10, 20, 0.6) 100%)',
          opacity: cardOpen ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }}
      />

      <Header />
      <ViewerGuide />
      {view !== 'transformer' && (
        <button
          type="button"
          onClick={() => showView('transformer')}
          // Like the model, stays inert while a details card is open.
          disabled={cardOpen}
          style={{
            position: 'absolute',
            top: 100,
            right: 40,
            padding: '10px 18px',
            border: 'none',
            borderRadius: 4,
            background: '#1a4fd6',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          ← Back to Transformer
        </button>
      )}
      {card && (
        <InstrumentDetails
          key={card.key}
          instrument={card.info}
          tag={card.hotspot.tag}
          number={card.number}
          onCloseStart={() => setCardOpen(false)}
          // Only the current card can get here (a replaced one unmounts mid slide-out), so also
          // clear the lock: whatever happens, a card that is gone never leaves the model locked.
          onClose={() => {
            setCard(null)
            setCardOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default App
