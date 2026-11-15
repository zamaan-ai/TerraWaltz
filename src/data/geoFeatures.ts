/**
 * High-Precision Geographical Context Features & Landmark Annotations
 * Reference: LETS_DANCE_MARK-7 Section 3 & DANCE_WITH_ME_MARK-4 Section 17
 */

export interface GeoFeature {
  id: string;
  hotspotId: string;
  name: string;
  type: 'island' | 'river' | 'mangrove_reserve' | 'embankment' | 'fault_line' | 'epicenter' | 'city';
  coordinates: [number, number][]; // [lat, lon]
  description: string;
  radarSignificance: string;
  status?: string;
}

export const GEO_FEATURES: GeoFeature[] = [
  // 1. Sundarbans - Estuary Islands
  {
    id: 'sagar_island',
    hotspotId: 'sundarbans_estuary',
    name: 'Sagar Island (Southern Tip)',
    type: 'island',
    coordinates: [
      [21.88, 88.08],
      [21.84, 88.09],
      [21.75, 88.07],
      [21.62, 88.05],
      [21.58, 88.08],
      [21.65, 88.16],
      [21.78, 88.17],
      [21.86, 88.15],
      [21.88, 88.08],
    ],
    description: 'Largest estuarine island in the Indian Sundarbans. Lost 33.62 km² of net area between 1969 and 1999 due to wave scour and relative sea-level rise.',
    radarSignificance: 'Co-pol HH highlights dynamic boundary between wet mudflat terrace and Hooghly tidal channel.',
  },
  {
    id: 'ghoramara_island',
    hotspotId: 'sundarbans_estuary',
    name: 'Ghoramara Island (Rapid Erosion)',
    type: 'island',
    coordinates: [
      [21.94, 88.12],
      [21.92, 88.11],
      [21.90, 88.13],
      [21.92, 88.15],
      [21.94, 88.12],
    ],
    description: 'Severely eroding island in the Muriganga estuary; lost ~50% of its land area over the last 40 years.',
    radarSignificance: 'Persistent dark specular backscatter shift (< -20 dB) marks western mudflat submersions.',
  },
  {
    id: 'lothian_island',
    hotspotId: 'sundarbans_estuary',
    name: 'Lothian Island Wildlife Sanctuary',
    type: 'mangrove_reserve',
    coordinates: [
      [21.72, 88.31],
      [21.68, 88.30],
      [21.65, 88.33],
      [21.70, 88.36],
      [21.72, 88.31],
    ],
    description: 'Protected mangrove island (30.00 km² FSI 2021). Dense canopy of Avicennia, Ceriops and Rhizophora.',
    radarSignificance: 'High HV cross-polarization return (-11 dB) from complex branch volume scattering.',
  },
  {
    id: 'kolkata_landmark',
    hotspotId: 'sundarbans_estuary',
    name: 'Kolkata Metropolis (Context)',
    type: 'city',
    coordinates: [[22.57, 88.36]],
    description: 'Major delta city located 85 km north of the open Bay of Bengal, providing geographic anchoring.',
    radarSignificance: 'Very bright corner-reflector scattering (> -2 dB) from high-density concrete buildings.',
  },

  // 2. Sundarbans - Matla Belt
  {
    id: 'matla_core_reserve',
    hotspotId: 'sundarbans_matla',
    name: 'Matla Core Mangrove Reserve',
    type: 'mangrove_reserve',
    coordinates: [
      [21.95, 88.58],
      [21.92, 88.52],
      [21.80, 88.55],
      [21.74, 88.62],
      [21.75, 88.75],
      [21.85, 88.85],
      [21.95, 88.78],
      [21.95, 88.58],
    ],
    description: 'Pristine Sundarbans Tiger Reserve mangrove canopy bordering Matla and Bidya estuaries.',
    radarSignificance: 'Monsoon high-tide triggers co-pol HH brightening (+4 dB) via water-trunk double-bounce.',
  },

  // 3. Sundarbans - Gosaba Belt
  {
    id: 'gosaba_aquaculture_zone',
    hotspotId: 'sundarbans_gosaba',
    name: 'Gosaba Inhabited Polder & Shrimp Ponds',
    type: 'embankment',
    coordinates: [
      [22.22, 88.72],
      [22.18, 88.70],
      [22.12, 88.75],
      [22.14, 88.88],
      [22.24, 88.85],
      [22.22, 88.72],
    ],
    description: 'Agricultural polders protected by mud dykes. High salinity intrusion drives conversion of paddy fields into shrimp aquaculture ponds.',
    radarSignificance: 'Cross-Polarization Ratio (HV - HH) distinguishes vegetated paddies from flat water ponds.',
  },

  // 4. Venezuela Earthquakes (Case Study from Section 17)
  {
    id: 'san_sebastian_fault',
    hotspotId: 'venezuela_earthquake_2026',
    name: 'San Sebastian Strike-Slip Fault Trace',
    type: 'fault_line',
    coordinates: [
      [10.65, -67.35],
      [10.63, -67.15],
      [10.61, -66.95],
      [10.59, -66.75],
      [10.57, -66.55],
    ],
    description: 'Major plate boundary fault between the Caribbean and South American plates. Ruptured on 24 June 2026 in M7.2 and M7.5 events.',
    radarSignificance: 'Discontinuity in unwrapped GUNW InSAR phase; sharp line separating eastward vs westward ground motion.',
  },
  {
    id: 'caracas_city',
    hotspotId: 'venezuela_earthquake_2026',
    name: 'Caracas Metropolitan Valley',
    type: 'city',
    coordinates: [[10.48, -66.90]],
    description: 'Capital of Venezuela situated in high mountain valley south of the coastal Avila range.',
    radarSignificance: 'InSAR phase coherence maintained across urban structures; serves as stable reference datum.',
  },
  {
    id: 'la_guaira_port',
    hotspotId: 'venezuela_earthquake_2026',
    name: 'La Guaira Port & Airport (Maiquetía)',
    type: 'city',
    coordinates: [[10.60, -66.98]],
    description: 'Coastal airport and port district where maximum horizontal ground motion of ~60 cm was mapped by NISAR Urgent Response.',
    radarSignificance: 'Near-fault phase decorrelation resolved using GOFF sub-pixel feature tracking.',
  },
  {
    id: 'venezuela_epicenter',
    hotspotId: 'venezuela_earthquake_2026',
    name: 'USGS M7.5 Epicenter (us6000t7zp)',
    type: 'epicenter',
    coordinates: [[10.62, -66.92]],
    description: 'Mainshock epicenter occurring on 24 June 2026 at depth of 14 km.',
    radarSignificance: 'Focal center of concentric InSAR interference fringes.',
  },
];
