import { Suspense, useRef, useState } from 'react'
import type { Mesh } from 'three'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls, Stage, useGLTF } from '@react-three/drei'
import modelUrl from './assets/transformer.glb'
import backgroundUrl from './assets/backgroundimage1.png'
import Header from './components/Header'
import ViewerGuide from './components/ViewerGuide'

interface Fan {
  id: string
  name: string
  position: [number, number, number]
  status: string
  params: { label: string; value: string }[]
}

const FAN_PARAMS = [
  { label: 'Operating Mode', value: 'Auto' },
  { label: 'Fan Type', value: 'Axial Fan' },
  { label: 'Rated Voltage', value: '415 V AC' },
  { label: 'Rated Power', value: '1.5 kW' },
  { label: 'Speed', value: '1,450 RPM' },
  { label: 'Airflow', value: '5,000 m³/h' },
  { label: 'Motor Temperature', value: '48 °C' },
  { label: 'Bearing Temperature', value: '42 °C' },
  { label: 'Runtime', value: '2,845 hrs' },
]

// Estimated from the model's bounding box; nudge these if a pointer sits off a fan.
const FANS: Fan[] = [
  { id: 'fan-1', name: 'Cooling Fan 1', position: [-0.7, -0.19, 0.65], status: 'Running', params: FAN_PARAMS },
  { id: 'fan-2', name: 'Cooling Fan 2', position: [0.4, -0.18, 0.65], status: 'Running', params: FAN_PARAMS },
  { id: 'fan-3', name: 'Cooling Fan 3', position: [-0.7, -0.61, 0.65], status: 'Running', params: FAN_PARAMS },
  { id: 'fan-4', name: 'Cooling Fan 4', position: [0.4, -0.61, 0.65], status: 'Running', params: FAN_PARAMS },
]

function FanMarker({
  fan,
  onSelect,
  occluderRef,
}: {
  fan: Fan
  onSelect: (fan: Fan) => void
  occluderRef: React.RefObject<Mesh>
}) {
  return (
    <Html position={fan.position} center distanceFactor={4} occlude={[occluderRef]}>
      <button
        type="button"
        onClick={() => onSelect(fan)}
        aria-label={`Show info for ${fan.name}`}
        style={{
          width: 30,
          height: 30,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          filter: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.5))',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="13.5" fill="#0b1e3d" stroke="#ffffff" strokeWidth="2" />
          <circle cx="15" cy="15" r="6" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="15" cy="15" r="2.5" fill="#2f6bff" />
        </svg>
      </button>
    </Html>
  )
}

function FanLabel({
  fan,
  onClose,
  occluderRef,
}: {
  fan: Fan
  onClose: () => void
  occluderRef: React.RefObject<Mesh>
}) {
  return (
    <Html position={fan.position} center distanceFactor={4} occlude={[occluderRef]} zIndexRange={[100, 0]}>
      <div
        style={{
          position: 'absolute',
          bottom: 26,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 190,
          borderRadius: 8,
          background: 'rgba(20, 20, 24, 0.94)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '6px 10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div>
            <div style={{ fontSize: 9, opacity: 0.7 }}>Component</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>{fan.name}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 12,
              lineHeight: 1,
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '6px 10px', fontSize: 9.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
            <span style={{ opacity: 0.75 }}>Status</span>
            <span style={{ fontWeight: 600, color: '#3ddc84' }}>&#9679; {fan.status}</span>
          </div>
          {fan.params.map((param) => (
            <div
              key={param.label}
              style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '2px 0' }}
            >
              <span style={{ opacity: 0.75, whiteSpace: 'nowrap' }}>{param.label}</span>
              <span style={{ fontWeight: 500, textAlign: 'right' }}>{param.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Html>
  )
}

function TransformerModel({
  selectedFan,
  onSelectFan,
  onCloseFan,
}: {
  selectedFan: Fan | null
  onSelectFan: (fan: Fan) => void
  onCloseFan: () => void
}) {
  const { scene } = useGLTF(modelUrl)
  const occluderRef = useRef<Mesh>(null!)
  return (
    <group>
      <primitive object={scene} />
      {/* Invisible stand-in for the tank body: cheap to raycast, used only to hide
          fan pointers once they rotate to the far side of the model. */}
      <mesh ref={occluderRef} position={[0, 0, -0.12]} visible={false}>
        <boxGeometry args={[2, 2, 1.25]} />
      </mesh>
      {FANS.map((fan) => (
        <FanMarker key={fan.id} fan={fan} onSelect={onSelectFan} occluderRef={occluderRef} />
      ))}
      {selectedFan && <FanLabel fan={selectedFan} onClose={onCloseFan} occluderRef={occluderRef} />}
    </group>
  )
}

function App() {
  const [selectedFan, setSelectedFan] = useState<Fan | null>(null)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
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
      <Canvas style={{ position: 'relative' }} camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} adjustCamera={1.5}>
            <TransformerModel
              selectedFan={selectedFan}
              onSelectFan={setSelectedFan}
              onCloseFan={() => setSelectedFan(null)}
            />
          </Stage>
        </Suspense>
        <OrbitControls />
      </Canvas>

      <Header />
      <ViewerGuide />
    </div>
  )
}

export default App
