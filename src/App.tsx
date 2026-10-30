import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LoopRepeat, type Mesh } from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stage, useAnimations, useGLTF } from '@react-three/drei'
import modelUrl from './assets/transformer.glb'
import rtccPanelUrl from './assets/RTCC_Panel.glb'
import fccPanelUrl from './assets/FCC_Panel.glb'
import backgroundUrl from './assets/backgroundimage1.png'
import Header from './components/Header'
import InstrumentDetails from './components/InstrumentDetails'
import ViewerGuide from './components/ViewerGuide'
import {
  DIGITAL_TEMPERATURE_INDICATOR,
  DTCC_TMS,
  MECHANICAL_TEMPERATURE_INDICATOR,
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
  { tag: 'WTI F71', position: [-0.521, 1.995, -0.22], info: MECHANICAL_TEMPERATURE_INDICATOR },
  { tag: 'WTI F72', position: [-0.219, 1.995, -0.22], info: MECHANICAL_TEMPERATURE_INDICATOR },
  { tag: 'WTI F73', position: [0.315, 1.995, -0.22], info: MECHANICAL_TEMPERATURE_INDICATOR },
  { tag: 'OTI F74', position: [0.616, 1.995, -0.22], info: MECHANICAL_TEMPERATURE_INDICATOR },
]

// In RTCC_Panel.glb, all facing +Z. Digital RTI meters: just above each P1_/P2_RTI_A1–A4_Body
// (top at y 1.88, front face at z 0.016), x at each meter's centre. DTCC-TMS units: on the
// top edge of each P1_/P2_DTCC_Chassis (top at y 1.219).
const RTCC_INSTRUMENTS: Instrument[] = [
  { tag: 'Panel 1 – RTI A1', position: [-0.539, 1.905, 0.02], info: DIGITAL_TEMPERATURE_INDICATOR },
  { tag: 'Panel 1 – RTI A2', position: [-0.42, 1.905, 0.02], info: DIGITAL_TEMPERATURE_INDICATOR },
  { tag: 'Panel 1 – RTI A3', position: [-0.3, 1.905, 0.02], info: DIGITAL_TEMPERATURE_INDICATOR },
  { tag: 'Panel 1 – RTI A4', position: [-0.18, 1.905, 0.02], info: DIGITAL_TEMPERATURE_INDICATOR },
  { tag: 'Panel 2 – RTI A1', position: [0.182, 1.905, 0.02], info: DIGITAL_TEMPERATURE_INDICATOR },
  { tag: 'Panel 2 – RTI A2', position: [0.3, 1.905, 0.02], info: DIGITAL_TEMPERATURE_INDICATOR },
  { tag: 'Panel 2 – RTI A3', position: [0.42, 1.905, 0.02], info: DIGITAL_TEMPERATURE_INDICATOR },
  { tag: 'Panel 2 – RTI A4', position: [0.54, 1.905, 0.02], info: DIGITAL_TEMPERATURE_INDICATOR },
  { tag: 'Panel 1 – DTCC-TMS', position: [-0.351, 1.222, 0.02], info: DTCC_TMS },
  { tag: 'Panel 2 – DTCC-TMS', position: [0.365, 1.222, 0.02], info: DTCC_TMS },
]

function Marker({
  position,
  label,
  onClick,
  occluderRef,
  distanceFactor = 10,
}: {
  position: [number, number, number]
  label: string
  onClick: () => void
  occluderRef: React.RefObject<Mesh>
  distanceFactor?: number
}) {
  return (
    <Html position={position} center distanceFactor={distanceFactor} occlude={[occluderRef]}>
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
        <svg width="20" height="20" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="13.5" fill="#0b1e3d" stroke="#ffffff" strokeWidth="2" />
          <circle cx="15" cy="15" r="6" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="15" cy="15" r="2.5" fill="#2f6bff" />
        </svg>
      </button>
    </Html>
  )
}

function TransformerModel({ onOpenView }: { onOpenView: (view: View) => void }) {
  const { scene, animations } = useGLTF(modelUrl)
  const { actions } = useAnimations(animations, scene)

  // The GLB's only clip spins all 12 cooler fan blade sets; loop it for as long as the
  // transformer is shown.
  useEffect(() => {
    actions['Cooler_Fans_Spin']?.reset().setLoop(LoopRepeat, Infinity).play()
  }, [actions])

  const tankOccluderRef = useRef<Mesh>(null!)
  const controlRoomOccluderRef = useRef<Mesh>(null!)
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
      <Marker
        position={FCC_POINTER_POSITION}
        label="Open FCC Panel"
        onClick={() => onOpenView('fcc')}
        occluderRef={tankOccluderRef}
      />
      <Marker
        position={CONTROL_ROOM_POINTER_POSITION}
        label="Open RTCC Panel"
        onClick={() => onOpenView('rtcc')}
        occluderRef={controlRoomOccluderRef}
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
          occluderRef={backWallRef}
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
          occluderRef={cabinetRef}
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

type View = 'transformer' | 'fcc' | 'rtcc'

useGLTF.preload(fccPanelUrl)
useGLTF.preload(rtccPanelUrl)

const AUTO_ROTATE_RESUME_MS = 5000

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
        <Suspense fallback={null}>
          {/* Keyed by view so Stage remounts and re-fits the camera to the new model. */}
          <Stage
            key={view}
            environment="city"
            intensity={0.5}
            adjustCamera={view === 'transformer' ? 0.75 : 0.9}
          >
            {view === 'transformer' && <TransformerModel onOpenView={showView} />}
            {view === 'fcc' && <FccPanelModel onSelectInstrument={setSelectedInstrument} />}
            {view === 'rtcc' && <RtccPanelModel onSelectInstrument={setSelectedInstrument} />}
          </Stage>
        </Suspense>
        {/* makeDefault lets Stage's adjustCamera fit the whole model; no maxDistance cap
            so the camera isn't clamped back inside large models. Polar angle is locked so the
            user can only rotate left/right, not tilt up/down. Right-drag moves the view (like
            Blender's hand tool) on every model. */}
        <OrbitControls
          makeDefault
          minDistance={1}
          minPolarAngle={Math.PI / 2.1}
          maxPolarAngle={Math.PI / 2.1}
          // Spin clockwise (seen from above); pause while the user drags or zooms and
          // resume after they've been idle for AUTO_ROTATE_RESUME_MS.
          // The FCC and RTCC panels stay still, facing front.
          autoRotate={autoRotate && view === 'transformer'}
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
      {view !== 'transformer' && selectedInstrument?.info && (
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
