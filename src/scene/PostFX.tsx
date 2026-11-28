import type { Object3D } from 'three'
import { Bloom, EffectComposer, Outline, ToneMapping } from '@react-three/postprocessing'
import { KernelSize, ToneMappingMode } from 'postprocessing'

// Bloom only picks up pixels brighter than this (linear, before tone mapping). Sunlit paint
// and porcelain highlights stay below it; the model's lit lamps, LEDs and LCDs (emissive
// strength 3–8 in the GLBs) are well above it, so only they glow.
const BLOOM_THRESHOLD = 2

// `highlight`: meshes of the instrument whose card is open; they get a soft, slowly pulsing
// brand-blue outline (brighter where visible, dimmer where hidden behind other parts).
export function PostFX({ highlight }: { highlight: Object3D[] }) {
  return (
    // 4× MSAA on the composer's buffers handles antialiasing (cleaner than SMAA on geometry
    // edges), so the canvas itself is created without antialias.
    <EffectComposer multisampling={4}>
      <Outline
        selection={highlight}
        visibleEdgeColor={0x8fb0ff}
        hiddenEdgeColor={0x1e4fd8}
        edgeStrength={6}
        pulseSpeed={0.35}
        blur
        kernelSize={KernelSize.SMALL}
      />
      <Bloom mipmapBlur luminanceThreshold={BLOOM_THRESHOLD} luminanceSmoothing={0.3} intensity={0.7} />
      {/* The composer turns the renderer's own tone mapping off, so apply ACES here, last. */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
