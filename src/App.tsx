import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LoopRepeat, type Mesh } from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stage, useAnimations, useGLTF } from '@react-three/drei'
import modelUrl from './assets/transformer/3D/transformer.glb'
import rtccPanelUrl from './assets/rtcc/3D/RTCC_Panel.glb'
import fccPanelUrl from './assets/fcc/3D/FCC_Panel.glb'
import backgroundUrl from './assets/backgroundimage1.png'
import Header from './components/Header'
import InstrumentDetails from './components/InstrumentDetails'
import PointerIcon from './components/PointerIcon'
import ViewerGuide from './components/ViewerGuide'
import {
  RTCC_REMOTE_INDICATOR_GALLERY,
  RTCC_TAP_GALLERY,
  RTCC_TMS_GALLERY,
  FCC_MECHANICAL_INSTRUMENT_GALLERY,
  FCC_ELECTRONIC_INSTRUMENT_GALLERY,
  FCC_CCC2_GALLERY,
  FCC_CCC3_GALLERY,
  BREATHER_GALLERY,
  BUCHHOLZ_GALLERY,
  MOG_GALLERY,
  PRV_GALLERY,
  type InstrumentInfo,
} from './instruments'

// On the FCC panel's instrument face (the MarshallingBox_* meshes in transformer.glb, tank's
// -Z side). The face sits at z ≈ -2.0, recessed behind the open doors which reach z -2.86.
const FCC_POINTER_POSITION: [number, number, number] = [1.25, 2.6, -2.05]

// Just above the "CONTROL ROOM" sign (ControlRoom_Sign_Text_mesh spans x 11.06–13.06,
// y 2.79–2.95) on the control room's front wall, which faces -Z at z ≈ -4.82.
const CONTROL_ROOM_POINTER_POSITION: [number, number, number] = [12.06, 3.2, -4.9]

interface Instrument {
  tag: string
  position: [number, number, number]
  // What the details card shows; pointers without it don't open a card yet.
  info?: InstrumentInfo
}

// On the top edge of each mechanical temperature indicator in fcc_panel.glb (the *_Body meshes span
// y 1.62–1.99, glass face at z -0.23, facing +Z). x is each dial's centre.
const FCC_INSTRUMENTS: Instrument[] = [
  { tag: 'WTI F71', position: [-0.521, 1.995, -0.22], info: FCC_MECHANICAL_INSTRUMENT_GALLERY },
  { tag: 'WTI F72', position: [-0.219, 1.995, -0.22], info: FCC_MECHANICAL_INSTRUMENT_GALLERY },
  // Right bay's electronic temperature controllers: on the top edge of each, x at its centre.
  // ETC_2243A_F73 spans x 0.175–0.457 (top y 1.907, front z -0.345); PMC_2243A_F74 spans
  // x 0.476–0.726 (top y 1.902, front z -0.373).
  { tag: 'WTI F73', position: [0.316, 1.917, -0.35], info: FCC_ELECTRONIC_INSTRUMENT_GALLERY },
  { tag: 'OTI F74', position: [0.601, 1.912, -0.378], info: FCC_ELECTRONIC_INSTRUMENT_GALLERY },
  // Above each DIN-rail transmitter (U1–U6 nodes at y 1.434, x = node centre; housing top at
  // y 1.472, front face at z -0.38), just below its "U1"–"U6" label at y 1.499.
  { tag: 'U1 – Winding Temp Transmitter', position: [0.143, 1.488, -0.37], info: FCC_CCC2_GALLERY },
  { tag: 'U2 – Winding Temp Transmitter', position: [0.257, 1.488, -0.37], info: FCC_CCC2_GALLERY },
  { tag: 'U3 – Winding Temp Transmitter', position: [0.371, 1.488, -0.37], info: FCC_CCC2_GALLERY },
  { tag: 'U4 – Oil Temp Transmitter', position: [0.485, 1.488, -0.37], info: FCC_CCC2_GALLERY },
  { tag: 'U5 – Tap Position Transmitter', position: [0.599, 1.488, -0.37], info: FCC_CCC2_GALLERY },
  { tag: 'U6 – Current Converter Unit', position: [0.713, 1.488, -0.37], info: FCC_CCC2_GALLERY },
  // On the cabinet's lower front section, between the two centre seams (front face at
  // z ≈ 0.02 per Cabinet_Bolts, which span y 0.07–0.53).
  { tag: 'FCC Panel', position: [0.04, 0.34, 0.03], info: FCC_CCC3_GALLERY },
]

// In RTCC_Panel.glb, all facing +Z. Digital RTI meters: just above each P1_/P2_RTI_A1–A4_Body
// (top at y 1.88, front face at z 0.016), x at each meter's centre. DTCC-TMS units: on the
// top edge of each P1_/P2_DTCC_Chassis (top at y 1.219).
const RTCC_INSTRUMENTS: Instrument[] = [
  { tag: 'Panel 1 – RTI A1', position: [-0.539, 1.905, 0.02], info: RTCC_REMOTE_INDICATOR_GALLERY },
  { tag: 'Panel 1 – RTI A2', position: [-0.42, 1.905, 0.02], info: RTCC_REMOTE_INDICATOR_GALLERY },
  { tag: 'Panel 1 – RTI A3', position: [-0.3, 1.905, 0.02], info: RTCC_REMOTE_INDICATOR_GALLERY },
  { tag: 'Panel 1 – RTI A4', position: [-0.18, 1.905, 0.02], info: RTCC_REMOTE_INDICATOR_GALLERY },
  { tag: 'Panel 2 – RTI A1', position: [0.182, 1.905, 0.02], info: RTCC_REMOTE_INDICATOR_GALLERY },
  { tag: 'Panel 2 – RTI A2', position: [0.3, 1.905, 0.02], info: RTCC_REMOTE_INDICATOR_GALLERY },
  { tag: 'Panel 2 – RTI A3', position: [0.42, 1.905, 0.02], info: RTCC_REMOTE_INDICATOR_GALLERY },
  { tag: 'Panel 2 – RTI A4', position: [0.54, 1.905, 0.02], info: RTCC_REMOTE_INDICATOR_GALLERY },
  // Tap position indicators: just above each P1_/P2_TPI_A5_Body (top at y 1.693, front face at
  // z 0.016), the same gap as the RTI pointers above their meters.
  { tag: 'Panel 1 – TPI A5', position: [-0.3, 1.718, 0.02], info: RTCC_TAP_GALLERY },
  { tag: 'Panel 2 – TPI A5', position: [0.42, 1.718, 0.02], info: RTCC_TAP_GALLERY },
  { tag: 'Panel 1 – DTCC-TMS', position: [-0.351, 1.222, 0.02], info: RTCC_TMS_GALLERY },
  { tag: 'Panel 2 – DTCC-TMS', position: [0.365, 1.222, 0.02], info: RTCC_TMS_GALLERY },
]

function Marker({
  position,
  label,
  onClick,
  occluders,
  distanceFactor = 10,
}: {
  position: [number, number, number]
  label: string
  onClick: () => void
  // Hides the pointer while any of these meshes is between it and the camera; omit to always
  // show it.
  occluders?: React.RefObject<Mesh>[]
  distanceFactor?: number
}) {
  return (
    <Html position={position} center distanceFactor={distanceFactor} occlude={occluders}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        style={{
          width: 20,
          height: 20,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.5))',
        }}
      >
        <PointerIcon />
      </button>
    </Html>
  )
}

// On top of the Smart_Breather_8KG cabinet (x 4.55–4.95, body top y 2.65), just in front of
// its door, which faces -Z at z ≈ -2.345 (same side as the FCC box).
const BREATHER_INSTRUMENT: Instrument = {
  tag: 'Smart Breather 8 kg',
  position: [4.75, 2.67, -2.37],
  info: BREATHER_GALLERY,
}

// Just above the Buchholz_Relay on the tank roof (x 3.41–3.72, top y 5.37, z -1.42 to -1.10),
// at its centre. It is on the roof's -Z (FCC) half, so the rear-half occluder hides it from the
// +Z side.
const BUCHHOLZ_INSTRUMENT: Instrument = {
  tag: 'Buchholz Relay',
  position: [3.56, 5.42, -1.26],
  info: BUCHHOLZ_GALLERY,
}

// Just above the Magnetic_Oil_Gauge on the conservator's end cap (x 4.21–4.50, top y 6.135),
// in front of its dial, which faces +Z with the glass at z ≈ 2.83.
const MOG_INSTRUMENT: Instrument = {
  tag: 'Magnetic Oil Gauge',
  position: [4.35, 6.17, 2.86],
  info: MOG_GALLERY,
}

// Just above the Pressure_Relief_Device on the tank roof, beside the Buchholz relay
// (x 3.07–3.31, top of its red lever y 4.98, z -0.96 to -0.74), at its centre. Kept above the
// tank occluder's top (y 5.04) so that box never hides it; like the Buchholz pointer it is on
// the roof's -Z half and is hidden from the +Z side by the rear-half occluder.
const PRV_INSTRUMENT: Instrument = {
  tag: 'Pressure Relief Device',
  position: [3.19, 5.07, -0.85],
  info: PRV_GALLERY,
}

function TransformerModel({
  onOpenView,
  onSelectInstrument,
}: {
  onOpenView: (view: View) => void
  onSelectInstrument: (instrument: Instrument) => void
}) {
  const { scene, animations } = useGLTF(modelUrl)
  const { actions } = useAnimations(animations, scene)

  // transformer.glb includes the Blender studio floor (a 400 × 400 m plane). Stage fits the
  // camera to the bounding box of everything in the scene, so that floor would make the
  // transformer a speck in the distance. Drop it before Stage measures: this layout effect runs
  // before Stage's own (parent effects run after their children's), and removing it from the
  // cached scene is a no-op on later mounts.
  useLayoutEffect(() => {
    scene.getObjectByName('Studio_Floor_Studio_Floor')?.removeFromParent()
  }, [scene])

  // The GLB's only clip spins all 12 cooler fan blade sets; loop it for as long as the
  // transformer is shown.
  useEffect(() => {
    actions['Cooler_Fans_Spin']?.reset().setLoop(LoopRepeat, Infinity).play()
  }, [actions])

  const tankOccluderRef = useRef<Mesh>(null!)
  const controlRoomOccluderRef = useRef<Mesh>(null!)
  const breatherOccluderRef = useRef<Mesh>(null!)
  const rearHalfOccluderRef = useRef<Mesh>(null!)
  const mogOccluderRef = useRef<Mesh>(null!)
  return (
    <group>
      <primitive object={scene} />
      {/* Invisible stand-ins: cheap to raycast, used only to hide each pointer once it
          rotates to the far side of its part. Sized to MainTank_Body's bounds... */}
      <mesh ref={tankOccluderRef} position={[-0.03, 2.52, 0.06]} visible={false}>
        <boxGeometry args={[7.97, 5.04, 3.67]} />
      </mesh>
      {/* ...and to ControlRoom_Wall_Cream's bounds. */}
      <mesh ref={controlRoomOccluderRef} position={[12.01, 1.69, -2.77]} visible={false}>
        <boxGeometry args={[2.6, 3.2, 4.1]} />
      </mesh>
      {/* ...and to Smart_Breather_8KG's cabinet. */}
      <mesh ref={breatherOccluderRef} position={[4.75, 2.394, -2.2]} visible={false}>
        <boxGeometry args={[0.41, 0.51, 0.32]} />
      </mesh>
      {/* ...and to the +Z half of the tank and coolers (x -4.02 to the coolers' outer edge at
          7.3, z -0.6 to the tank fittings' face at 1.9), raised to y 6 so it also stands above
          the roof: hides the -Z side's roof and breather pointers from the +Z side. It starts
          just +Z of the PRV (z -0.74), so it never covers the pointers it hides. */}
      <mesh ref={rearHalfOccluderRef} position={[1.64, 3.0, 0.65]} visible={false}>
        <boxGeometry args={[11.32, 6.0, 2.5]} />
      </mesh>
      <Marker
        position={BREATHER_INSTRUMENT.position}
        label={`Show details for ${BREATHER_INSTRUMENT.tag}`}
        onClick={() => onSelectInstrument(BREATHER_INSTRUMENT)}
        occluders={[breatherOccluderRef, rearHalfOccluderRef]}
      />
      <Marker
        position={BUCHHOLZ_INSTRUMENT.position}
        label={`Show details for ${BUCHHOLZ_INSTRUMENT.tag}`}
        onClick={() => onSelectInstrument(BUCHHOLZ_INSTRUMENT)}
        occluders={[rearHalfOccluderRef]}
      />
      <Marker
        position={PRV_INSTRUMENT.position}
        label={`Show details for ${PRV_INSTRUMENT.tag}`}
        onClick={() => onSelectInstrument(PRV_INSTRUMENT)}
        occluders={[rearHalfOccluderRef]}
      />
      {/* ...and to the conservator drum's cross-section (x 3.06–4.94, y 5.6–7.48) from its -Z
          end to z 2.7, just behind the MOG (z 2.74), so the MOG pointer hides from the far
          side, including the oblique end-on views a narrower box let through. */}
      <mesh ref={mogOccluderRef} position={[4.0, 6.54, 0.275]} visible={false}>
        <boxGeometry args={[1.88, 1.88, 4.85]} />
      </mesh>
      <Marker
        position={MOG_INSTRUMENT.position}
        label={`Show details for ${MOG_INSTRUMENT.tag}`}
        onClick={() => onSelectInstrument(MOG_INSTRUMENT)}
        occluders={[mogOccluderRef]}
      />
      <Marker
        position={FCC_POINTER_POSITION}
        label="Open FCC Panel"
        onClick={() => onOpenView('fcc')}
        occluders={[tankOccluderRef]}
      />
      <Marker
        position={CONTROL_ROOM_POINTER_POSITION}
        label="Open RTCC Panel"
        onClick={() => onOpenView('rtcc')}
        occluders={[controlRoomOccluderRef]}
      />
    </group>
  )
}

function FccPanelModel({ onSelectInstrument }: { onSelectInstrument: (instrument: Instrument) => void }) {
  const { scene, animations } = useGLTF(fccPanelUrl)
  const { actions } = useAnimations(animations, scene)
  const backWallRef = useRef<Mesh>(null!)

  // The GLB's only clip moves the dial pointers of the temperature indicators; loop it for
  // as long as the FCC panel is shown.
  useEffect(() => {
    actions['Instrument_Pointers']?.reset().setLoop(LoopRepeat, Infinity).play()
  }, [actions])
  return (
    <group>
      <primitive object={scene} />
      {/* Invisible stand-in for the cabinet's back wall, behind the instruments: hides the
          pointers when the panel is turned around. */}
      <mesh ref={backWallRef} position={[0.01, 1.13, -0.51]} visible={false}>
        <boxGeometry args={[2.0, 2.18, 0.18]} />
      </mesh>
      {FCC_INSTRUMENTS.map((instrument) => (
        <Marker
          key={instrument.tag}
          position={instrument.position}
          label={`Show details for ${instrument.tag}`}
          onClick={() => onSelectInstrument(instrument)}
          occluders={[backWallRef]}
          // The panel is far smaller than the transformer, so the camera sits much closer.
          distanceFactor={2}
        />
      ))}
    </group>
  )
}

function RtccPanelModel({ onSelectInstrument }: { onSelectInstrument: (instrument: Instrument) => void }) {
  const { scene } = useGLTF(rtccPanelUrl)
  const cabinetRef = useRef<Mesh>(null!)
  return (
    <group>
      <primitive object={scene} />
      {/* Invisible stand-in for both cabinets (Cabinet_1/2_Body), stopping just behind the
          front face: hides the pointers when the panels are turned around. */}
      <mesh ref={cabinetRef} position={[0, 1.11, -0.325]} visible={false}>
        <boxGeometry args={[1.43, 2.2, 0.55]} />
      </mesh>
      {RTCC_INSTRUMENTS.map((instrument) => (
        <Marker
          key={instrument.tag}
          position={instrument.position}
          label={`Show details for ${instrument.tag}`}
          onClick={() => onSelectInstrument(instrument)}
          occluders={[cabinetRef]}
          // Same scale as the FCC panel, so the same factor keeps pointers the same size.
          distanceFactor={2}
        />
      ))}
    </group>
  )
}

// Start each view facing the model's front: the transformer's FCC side is -Z, while the
// FCC and RTCC panels' doors face +Z. Stage then fits the distance along this direction.
function ResetCamera({ view }: { view: View }) {
  const camera = useThree((state) => state.camera)
  useLayoutEffect(() => {
    camera.position.set(0, 0, view === 'transformer' ? -5 : 5)
  }, [camera, view])
  return null
}

// The FCC panel can be zoomed right up to its instruments. Stage sets the camera's near plane
// to 1/100 of its fitting distance (and again on every resize), which would slice the
// instruments off when that close, so hold a smaller near plane while this is mounted.
const FCC_MIN_DISTANCE = 0.05
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

type View = 'transformer' | 'fcc' | 'rtcc'

useGLTF.preload(fccPanelUrl)
useGLTF.preload(rtccPanelUrl)

const AUTO_ROTATE_RESUME_MS = 10000

function App() {
  const [view, setView] = useState<View>('transformer')
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)

  const showView = (next: View) => {
    setSelectedInstrument(null)
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

  // overflow: hidden clips overlays that animate past the viewport edge (e.g. the
  // instrument details sliding in from the right) so they can't add page scrollbars.
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
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
      <Canvas style={{ position: 'relative' }} camera={{ position: [0, 0, -5], fov: 30 }}>
        <ResetCamera view={view} />
        {view === 'fcc' && <KeepCameraNear near={FCC_CAMERA_NEAR} />}
        <Suspense fallback={null}>
          {/* Keyed by view so Stage remounts and re-fits the camera to the new model. */}
          <Stage
            key={view}
            environment="city"
            intensity={0.5}
            adjustCamera={view === 'transformer' ? 0.75 : 0.9}
          >
            {view === 'transformer' && (
              <TransformerModel onOpenView={showView} onSelectInstrument={setSelectedInstrument} />
            )}
            {view === 'fcc' && <FccPanelModel onSelectInstrument={setSelectedInstrument} />}
            {view === 'rtcc' && <RtccPanelModel onSelectInstrument={setSelectedInstrument} />}
          </Stage>
        </Suspense>
        {/* makeDefault lets Stage's adjustCamera fit the whole model; no maxDistance cap
            so the camera isn't clamped back inside large models. Polar angle is locked so the
            user can only rotate left/right, not tilt up/down. Right-drag moves the view (like
            Blender's hand tool) on every model. Only the FCC panel zooms in close. */}
        <OrbitControls
          makeDefault
          minDistance={view === 'fcc' ? FCC_MIN_DISTANCE : 1}
          minPolarAngle={Math.PI / 2.1}
          maxPolarAngle={Math.PI / 2.1}
          // Spin clockwise (seen from above); pause while the user drags or zooms and
          // resume after they've been idle for AUTO_ROTATE_RESUME_MS.
          // The FCC and RTCC panels stay still, facing front. The transformer also holds
          // still while a details card is open, so its part stays beside the card.
          autoRotate={autoRotate && view === 'transformer' && !selectedInstrument}
          autoRotateSpeed={-2}
          onStart={pauseAutoRotate}
          onEnd={scheduleAutoRotate}
        />
      </Canvas>

      <Header />
      <ViewerGuide />
      {view !== 'transformer' && (
        <button
          type="button"
          onClick={() => showView('transformer')}
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
      {selectedInstrument?.info && (
        <InstrumentDetails
          key={selectedInstrument.tag}
          instrument={selectedInstrument.info}
          tag={selectedInstrument.tag}
          onClose={() => setSelectedInstrument(null)}
        />
      )}
    </div>
  )
}

export default App
