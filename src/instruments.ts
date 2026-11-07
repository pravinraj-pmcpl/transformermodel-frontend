import digitalImageUrl from './assets/rtcc/digital.jpg'
import dtccTmsImageUrl from './assets/rtcc/DTCC-TMS.PNG'
import mechanicalImageUrl from './assets/fcc/mechanical_instrument.jpg'

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

// FCC panel's DIN-rail transmitters (U1–U6): product gallery from the CCC2 folder.
export const FCC_CCC2_GALLERY: InstrumentInfo = {
  title: 'Transmitter',
  gallery: toGallery(
    import.meta.glob<string>('./assets/fcc/CCC2/*.webp', { eager: true, import: 'default' }),
  ),
}

// FCC panel's dial thermometers (WTI / OTI).
export const MECHANICAL_TEMPERATURE_INDICATOR: InstrumentInfo = {
  title: 'Mechanical Temperature Indicator',
  imageUrl: mechanicalImageUrl,
  specificationsHeading: 'General Standard Specifications',
  specifications: [
    { label: 'Temperature Range', value: '0-150°C, Standard (other ranges on request)' },
    { label: 'Dial Size', value: '150mm (6") Round' },
    { label: 'Dial angular Sweep', value: '270°' },
    { label: 'Dial Graduation', value: '1°C' },
    { label: 'Accuracy Class', value: '±1% of FSD' },
    { label: 'Contacts', value: 'Upto 6 Normally open Contacts' },
    { label: 'Contact Rating', value: 'Standard Micro Switch 15A @ 250V AC or 0.5A @ 250V DC' },
    { label: 'Switching Range', value: '15% - 85% of FSD' },
    {
      label: 'Switch Differential',
      value: 'S1 & S2: 3°C to 9°C (6±3°C) Fixed. S3 to S6: 8°C to 40°C Adjustable.',
    },
    { label: 'Switching Accuracy', value: '±2.5°C of Set Value' },
    { label: 'Max. Capillary Length', value: 'Up to 25 Mtrs (Bottom Entry)' },
    { label: 'Switch Test Knob', value: 'Available' },
    { label: 'Electrical Connection', value: 'Press Fit Wago Type' },
    { label: 'Window Glass', value: 'UV Resistant Polycarbonate' },
    { label: 'Degree of Protection', value: 'IP – 55 (IEC - 60529 Cat -II)' },
    { label: 'Electrical entry', value: 'M20 Threaded Holes - 3Nos' },
  ],
}

// RTCC panel's digital remote temperature indicators (RTI), model 2244-T3.
export const DIGITAL_TEMPERATURE_INDICATOR: InstrumentInfo = {
  title: 'Digital Temperature Indicator',
  imageUrl: digitalImageUrl,
  specificationsHeading: 'Specifications – Model 2244-T3',
  specifications: [
    { label: 'Temperature Sensor input', value: 'RTD (Pt-100 IEC 60751)' },
    { label: 'No. of Sensor inputs', value: '1 No' },
    { label: 'No. of Relays', value: "2 No's (Alarm & Trip)" },
    {
      label: 'Range',
      value: '0 - 150 °C by default (Other ranges available on request -99.9°C to 400.0°C)',
    },
    { label: 'Resolution', value: '0.1°C' },
    { label: 'Accuracy', value: '±1°C' },
    { label: 'Display', value: 'Quad Seven Segment LED display for Temperature' },
    { label: 'Auxiliary Supply Voltage', value: '90-260V AC/DC' },
    { label: 'Output', value: 'Analogue output DC 4-20mA (Maximum burden 600 Ohms)' },
    { label: 'Contact Rating @ Resistive Load', value: '5A @ 220 VAC / 1A @ 220VDC' },
    { label: 'Power Consumption', value: '2 Watts' },
    { label: 'Weight', value: '0.5Kg. Approx without packing box' },
    { label: 'Enclosure', value: '96 Sq mm ABS Box Enclosure IP-20' },
    { label: 'Mounting', value: '92 x 92 Cutout' },
    { label: 'Operating conditions', value: 'Temp : 0°C to 60°C' },
  ],
}

// RTCC panel's DTCC-TMS rack unit, model 3000.
export const DTCC_TMS: InstrumentInfo = {
  title: 'DTCC-TMS',
  imageUrl: dtccTmsImageUrl,
  specificationsHeading: 'Specifications – Model 3000',
  specifications: [
    { label: 'Model No', value: '3000' },
    { label: 'Supply Voltage', value: 'AC 85-264V & DC 120-370V' },
    { label: 'Display', value: 'LCD 160*128' },
    { label: 'Keypad', value: '10 Nos' },
    { label: 'PT-100', value: '5 Channels (Others on request)' },
    { label: 'PT-100 Range', value: '0° to 150°C (Other Range on Request)' },
    { label: 'Temperature Resolution', value: '0.1°C' },
    { label: 'Temperature Accuracy', value: '±1°C FSD' },
    { label: '4-20mA DC Current Input', value: '8 Channels (Others on request)' },
    { label: '4-20mA DC Current Output', value: '8 Channels (Others on request)' },
    {
      label: 'Tap Position',
      value:
        '1. Resistance Input - 1K OHMS Per Step 1-39 Position (Other Range on Request) ' +
        '2. BCD Input 1-39 Position. 3. 4-20mA DC Current Input 1-39 Position.',
    },
    {
      label: 'RS-485 MODBUS RTU Protocol communication',
      value: 'IED Communication (Energy Meter, HOT SPOT, TAN Delta, GAS Analyzer etc)',
    },
    { label: 'Ethernet Communication', value: 'Ethernet Modbus TCP/IP' },
    { label: 'Protocol Communication', value: 'IEC61850 (Others on Request)' },
    { label: 'GSM', value: 'SMS Alerts for multiple user' },
    { label: 'GPS', value: 'Time Sync' },
    { label: 'Voltage Transducer', value: 'Voltage & Current 3 Phase' },
    { label: 'AVR', value: 'MANUAL/AUTO WITH LDC' },
    { label: 'PARALLEL OPERATION', value: 'INDEPENDENT/MASTER/FOLLOWER/OFF' },
    { label: 'STATISTICS', value: 'TAP STATISTICS' },
    { label: 'EVENT & DATALOG', value: 'Event & Data Log on PC' },
    // The datasheet lists these three as features with no specification text.
    { label: 'Loss of Life', value: 'Available' },
    { label: 'Overload Capability', value: 'Available' },
    { label: 'Cooler Control with Fan Exerciser', value: 'Available' },
    {
      label: 'LED Indication',
      value:
        '96 LEDs for Digital Input, 32 LEDs for Digital Outputs, Auto, Manual, Local, Remote, ' +
        'CPU Status, Ethernet Link, Ethernet Data, IED Rx, IED Tx & KEY Lock',
    },
    { label: 'Digital Input', value: '96 Digital Inputs (50-250V AC or DC) (Others on request)' },
    { label: 'Digital Output', value: '32 Digital Outputs (Others on request)' },
    { label: 'Terminals', value: 'Suitable for 2.5 sq.mm. wire' },
    { label: 'Insulation', value: 'Insulation resistance 100Mohm min at 500V.' },
    { label: 'Over all Dimension', value: 'H*W*D = 133mm*483mm*252mm' },
    { label: 'Mounting', value: 'Rack Mounting' },
    { label: 'Weight', value: 'Approximate Weight 7.5Kg' },
    {
      label: 'Enclosure',
      value:
        '19inch Rack & Size - 3U(133mm) for max of 13 IO modules. ' +
        'For more than 13 IO modules the enclosure will be changed to 6U.',
    },
    { label: 'Operating Temperature', value: '-20°C to 60°C' },
    { label: 'Storage Temperature', value: '-30°C to 80°C' },
    { label: 'EMI/ EMC', value: 'IEC61000-4-2, IEC61000-4-4, IEC61000-4-5, IEC61000-4-11' },
  ],
}
