import { Mesh, MeshPhysicalMaterial, MeshStandardMaterial, type Material, type Object3D } from 'three'

// Painted steel (tank, conservator, radiators, cabinets) was exported from Blender quite glossy
// (roughness 0.28–0.45), which reads as plastic under a real sun. Industrial enamel sits
// around 0.55–0.6.
const PAINT_ROUGHNESS = 0.58

function tuneMaterial(material: Material) {
  if (!(material instanceof MeshStandardMaterial)) return
  if (/paint/i.test(material.name) && material.metalness < 0.2 && material.roughness < PAINT_ROUGHNESS) {
    material.roughness = PAINT_ROUGHNESS
  }
}

function isSeeThrough(material: Material) {
  return (
    material.transparent ||
    material.opacity < 1 ||
    (material instanceof MeshPhysicalMaterial && material.transmission > 0)
  )
}

// Prepares a loaded GLB scene for the sun: every solid mesh casts and receives shadows (glass
// only receives, so gauge windows don't throw solid shadows), and painted surfaces get a
// realistic roughness. useGLTF caches scenes, so this runs once per model, not per mount.
export function prepareModel(scene: Object3D) {
  if (scene.userData.prepared) return
  scene.userData.prepared = true
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return
    const materials: Material[] = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach(tuneMaterial)
    object.castShadow = !materials.some(isSeeThrough)
    object.receiveShadow = true
  })
}
