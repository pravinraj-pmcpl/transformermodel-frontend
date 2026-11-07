
export interface Specification {
  label: string
  value: string
}

export interface GalleryImage {
  name: string
  imageUrl: string
}

// A details card shows either a product image with its specification table, or a gallery.
export interface InstrumentInfo {
  title: string
  imageUrl?: string
  specificationsHeading?: string
  specifications?: Specification[]
  gallery?: GalleryImage[]
}

// Every image in a folder, named after its file: "TEMP_CONTROLLER_2243A_1oti3wti.webp"
// becomes "TEMP CONTROLLER 2243A 1oti3wti". Adding or removing a file updates the gallery.
// (import.meta.glob needs literal patterns, so each folder is globbed at its call site.)
function toGallery(images: Record<string, string>): GalleryImage[] {
  return Object.entries(images)
    .map(([path, imageUrl]) => ({
      name: path.split('/').pop()!.replace(/\.webp$/, '').replaceAll('_', ' '),
      imageUrl,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
}

// FCC panel's dial thermometers: product gallery from the CCC1 folder.
export const FCC_CCC1_GALLERY: InstrumentInfo = {
  title: 'Mechanical Temperature Indicator',
  gallery: toGallery(
    import.meta.glob<string>('./assets/fcc/CCC1/*.webp', { eager: true, import: 'default' }),
  ),
}

// RTCC panel's remote temperature indicators (RTI A1–A4 on both panels): gallery from the
// RemoteIndicator folder.
export const RTCC_REMOTE_INDICATOR_GALLERY: InstrumentInfo = {
  title: 'Digital Temperature Indicator',
  gallery: toGallery(
    import.meta.glob<string>('./assets/rtcc/RemoteIndicator/*.webp', {
      eager: true,
      import: 'default',
    }),
  ),
}

// RTCC panel's tap position indicators (TPI A5 on both panels): gallery from the Tap folder.
export const RTCC_TAP_GALLERY: InstrumentInfo = {
  title: 'Tap Position Indicator',
  gallery: toGallery(
    import.meta.glob<string>('./assets/rtcc/Tap/*.webp', { eager: true, import: 'default' }),
  ),
}

// FCC panel cabinet itself (pointer on its lower front section): gallery from the CCC3 folder.
export const FCC_CCC3_GALLERY: InstrumentInfo = {
  title: 'FCC Marshalling Box',
  gallery: toGallery(
    import.meta.glob<string>('./assets/fcc/CCC3/*.webp', { eager: true, import: 'default' }),
  ),
}

// FCC panel's DIN-rail transmitters (U1–U6): product gallery from the CCC2 folder.
export const FCC_CCC2_GALLERY: InstrumentInfo = {
  title: 'Transmitter',
  gallery: toGallery(
    import.meta.glob<string>('./assets/fcc/CCC2/*.webp', { eager: true, import: 'default' }),
  ),
}

// RTCC panel's DTCC-TMS rack units (one per panel): gallery from the TMS folder.
export const RTCC_TMS_GALLERY: InstrumentInfo = {
  title: 'DTCC-TMS',
  gallery: toGallery(
    import.meta.glob<string>('./assets/rtcc/TMS/*.webp', { eager: true, import: 'default' }),
  ),
}
