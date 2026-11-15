/**
 * TerraWaltz Curated Study Areas, Hotspots and Case Studies
 * Reference: LETS_DANCE_MARK-7 (Section 3) and DANCE_WITH_ME_MARK-4 (Section 17)
 */

export interface HotspotStoryChapter {
  id: string;
  chapterNumber: number;
  title: string;
  visualLabel: string;
  scientificMessage: string;
  physicalHypothesis: string;
  corroborationSources: string[];
}

export interface Hotspot {
  id: string;
  name: string;
  region: string;
  phenomenon: 'coastal_erosion' | 'mangrove_degradation' | 'aquaculture_conversion' | 'earthquake_insar' | 'flood_inundation' | 'wetland_extent' | 'glacier_ice';
  phenomenonLabel: string;
  bbox: [number, number, number, number]; // [lon_min, lat_min, lon_max, lat_max]
  center: [number, number]; // [lat, lon]
  zoom: number;
  description: string;
  recommendedWorkflow: 'water_inundation' | 'backscatter_change' | 'mangrove_trend' | 'shoreline_change' | 'insar_deformation';
  recommendedPolarization: 'HH' | 'HV' | 'VV' | 'VH' | 'cross_ratio';
  recommendedProduct: 'GCOV' | 'GUNW' | 'GSLC' | 'GOFF';
  suggestedDates: {
    preEvent: string;
    postEvent: string;
  };
  keyLiterature: {
    title: string;
    source: string;
    doiOrUrl?: string;
  }[];
  storyChapters: HotspotStoryChapter[];
  precomputedStats: {
    baselineGamma0Db: number;
    deltaGamma0Db: number;
    waterAreaKm2Pre: number;
    waterAreaKm2Post: number;
    canopyLossPercent?: number;
    maxDisplacementMm?: number;
    losSignConvention?: string;
    anomalyIndex: number;
    sceiScore: number;
    coherenceMean: number;
    validFraction: number;
    looksN: number;
  };
  sampleGranules: string[];
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: 'sundarbans_estuary',
    name: 'Estuary Islands (Sagar, Ghoramara, Lothian)',
    region: 'Indian Sundarbans, West Bengal',
    phenomenon: 'coastal_erosion',
    phenomenonLabel: 'Island Shoreline Retreat & Tidal Inundation',
    bbox: [88.0, 21.55, 88.4, 22.01],
    center: [21.78, 88.2],
    zoom: 11,
    description: 'Rapidly retreating estuarine islands facing the open Bay of Bengal. Ghoramara has lost ~50% of its land area over 40 years, with Sagar Island losing over 33 km² due to relative sea-level rise and tidal scour.',
    recommendedWorkflow: 'shoreline_change',
    recommendedPolarization: 'HH',
    recommendedProduct: 'GCOV',
    suggestedDates: {
      preEvent: '2026-06-25T00:30:00Z',
      postEvent: '2026-09-17T00:30:00Z',
    },
    keyLiterature: [
      {
        title: 'New Moore Island Study & Ghoramara Island Retreat',
        source: 'J. Indian Soc. Remote Sensing',
      },
      {
        title: 'Lothian Island Mangrove Survey (30.00 km² FSI 2021)',
        source: 'Global Mangrove Watch 2020 & ISPRS Archives 2026',
      },
    ],
    storyChapters: [
      {
        id: 'c1',
        chapterNumber: 1,
        title: 'Why Radar in the Delta',
        visualLabel: 'Cloudy Optical vs Clear NISAR L-band SAR',
        scientificMessage: 'During the Southwest Monsoon, optical sensors are blinded by heavy overcast 85% of passes. Active L-band microwave pulses penetrate dense clouds and rain cells unimpeded.',
        physicalHypothesis: 'Radar sees through monsoon clouds every 12 days to give an uninterrupted temporal sequence.',
        corroborationSources: ['Copernicus Browser S2', 'JRC Global Surface Water'],
      },
      {
        id: 'c2',
        chapterNumber: 2,
        title: 'Islands on the Edge',
        visualLabel: 'Water-mask boundary delta at matching tide stages',
        scientificMessage: 'Comparing Otsu-derived water masks between matching spring tide stages reveals net shoreline loss of 1.82 km² along western mudflat terraces.',
        physicalHypothesis: 'Relative sea-level rise (subsidence 2.8 mm/yr + sea rise) combined with tidal currents causes edge embankment collapse.',
        corroborationSources: ['Survey of India Diamond Harbour Tide Tables', 'Natural Hazards 2025'],
      },
    ],
    precomputedStats: {
      baselineGamma0Db: -14.2,
      deltaGamma0Db: -4.8,
      waterAreaKm2Pre: 210.4,
      waterAreaKm2Post: 218.1,
      anomalyIndex: 0.68,
      sceiScore: 74.2,
      coherenceMean: 0.62,
      validFraction: 0.985,
      looksN: 32,
    },
    sampleGranules: [
      'NISAR_L2_PR_GCOV_026_089_A_045_40_DH_A_20260625T003412_20260625T003448_P05023_P_F_J_001.h5',
      'NISAR_L2_PR_GCOV_033_089_A_045_40_DH_A_20260917T003412_20260917T003448_P05023_P_F_J_001.h5',
    ],
  },
  {
    id: 'sundarbans_matla',
    name: 'Matla Belt (Core Mangrove Biosphere)',
    region: 'Indian Sundarbans, West Bengal',
    phenomenon: 'mangrove_degradation',
    phenomenonLabel: 'Mangrove Canopy Volume Scattering & Die-off',
    bbox: [88.5, 21.7, 88.9, 22.0],
    center: [21.85, 88.7],
    zoom: 11,
    description: 'Dense Sundari and Gewa mangrove reserve along the Matla river estuary. Cross-polarized (HV) radar return isolates volume scattering from woody branch architecture, revealing salinity-driven canopy thinning.',
    recommendedWorkflow: 'mangrove_trend',
    recommendedPolarization: 'HV',
    recommendedProduct: 'GCOV',
    suggestedDates: {
      preEvent: '2026-06-25T00:30:00Z',
      postEvent: '2026-10-23T00:30:00Z',
    },
    keyLiterature: [
      {
        title: 'Persistent-scatterer InSAR study: -2.4 to -2.8 mm/yr subsidence',
        source: 'Natural Hazards 2025',
      },
      {
        title: 'Mangrove health trajectory in Indian Sundarbans',
        source: 'Cornforth et al. 2013 & India Water Portal 2026',
      },
    ],
    storyChapters: [
      {
        id: 'c3',
        chapterNumber: 3,
        title: 'The Green Shield',
        visualLabel: 'HV cross-polarization median inside Mangrove Mask',
        scientificMessage: 'Cross-pol HV backscatter dropped from -11.2 dB to -14.6 dB in eastern sectors, showing decreased woody canopy volume scattering.',
        physicalHypothesis: 'Reduced upstream freshwater flushing from the Farakka barrage increases soil salinity, causing crown dieback and defoliation.',
        corroborationSources: ['Global Mangrove Watch 2020 mask', 'Sentinel-2 NDVI verification'],
      },
      {
        id: 'c4',
        chapterNumber: 4,
        title: 'Double-Bounce Inundation',
        visualLabel: 'HH co-pol brightening beneath tree stems',
        scientificMessage: 'Co-pol HH backscatter increased by +4.1 dB during peak monsoon spring tides while HV remained steady, confirming sub-canopy water table rise.',
        physicalHypothesis: 'Corner-reflection double-bounce between standing tidal water and vertical mangrove trunks amplifies co-pol echoes.',
        corroborationSources: ['Shiroma (2026) GCOV Specification'],
      },
    ],
    precomputedStats: {
      baselineGamma0Db: -11.2,
      deltaGamma0Db: -3.4,
      waterAreaKm2Pre: 142.1,
      waterAreaKm2Post: 159.6,
      canopyLossPercent: 7.8,
      anomalyIndex: 0.72,
      sceiScore: 78.5,
      coherenceMean: 0.54,
      validFraction: 0.991,
      looksN: 64,
    },
    sampleGranules: [
      'NISAR_L2_PR_GCOV_026_089_A_045_40_DH_A_20260625T003412_20260625T003448_P05023_P_F_J_001.h5',
      'NISAR_L2_PR_GCOV_036_089_A_045_40_DH_A_20261023T003412_20261023T003448_P05023_P_F_J_001.h5',
    ],
  },
  {
    id: 'sundarbans_gosaba',
    name: 'Gosaba Belt (Inhabited Embankments)',
    region: 'South 24 Parganas, West Bengal',
    phenomenon: 'aquaculture_conversion',
    phenomenonLabel: 'Paddy-to-Shrimp Aquaculture & Embankment Breaches',
    bbox: [88.65, 22.05, 88.95, 22.3],
    center: [22.17, 88.8],
    zoom: 12,
    description: 'Human-dominated agricultural frontier where earthen bunds protect 2 million delta residents. Saltwater intrusion and market forces drive widespread conversion of vegetated rice paddies into open brackish shrimp aquaculture ponds.',
    recommendedWorkflow: 'backscatter_change',
    recommendedPolarization: 'cross_ratio',
    recommendedProduct: 'GCOV',
    suggestedDates: {
      preEvent: '2026-07-07T00:30:00Z',
      postEvent: '2026-10-23T00:30:00Z',
    },
    keyLiterature: [
      {
        title: 'Cyclone Yaas embankment breach & cropland inundation survey',
        source: 'Down To Earth & The Third Pole',
      },
      {
        title: 'Human-wildlife & livelihood geography of Gosaba',
        source: 'Census of India & WorldPop 2026',
      },
    ],
    storyChapters: [
      {
        id: 'c5',
        chapterNumber: 5,
        title: 'People, Paddies and Saline Ponds',
        visualLabel: 'CPR (HV - HH) and Otsu water classification',
        scientificMessage: 'Persistent dark backscatter polygons (< -19 dB) expanded by 14.6 km², replacing previously seasonal crop backscatter cycles.',
        physicalHypothesis: 'Farmers intentionally breaching or converting post-salinized agricultural plots into intensive tiger shrimp ponds.',
        corroborationSources: ['WorldPop Population density', 'ESA WorldCover 2026'],
      },
    ],
    precomputedStats: {
      baselineGamma0Db: -13.8,
      deltaGamma0Db: -6.2,
      waterAreaKm2Pre: 68.2,
      waterAreaKm2Post: 82.8,
      anomalyIndex: 0.81,
      sceiScore: 84.1,
      coherenceMean: 0.71,
      validFraction: 0.978,
      looksN: 32,
    },
    sampleGranules: [
      'NISAR_L2_PR_GCOV_027_089_A_045_40_DH_A_20260707T003412_20260707T003448_P05023_P_F_J_001.h5',
      'NISAR_L2_PR_GCOV_036_089_A_045_40_DH_A_20261023T003412_20261023T003448_P05023_P_F_J_001.h5',
    ],
  },
  {
    id: 'venezuela_earthquake_2026',
    name: 'Venezuela Northern Coast (Caracas & La Guaira)',
    region: 'Federal District & Vargas, Venezuela',
    phenomenon: 'earthquake_insar',
    phenomenonLabel: 'Coseismic Fault Slip & InSAR Phase Fringes',
    bbox: [-67.15, 10.45, -66.75, 10.75],
    center: [10.6, -66.95],
    zoom: 11,
    description: 'Case study from DANCE_WITH_ME_MARK-4 (Section 17): Magnitude 7.2 earthquake (event us6000t7zc) followed by M7.5 mainshock on 24 June 2026 along northern strike-slip fault. First operational use of NISAR Urgent Response (UR) to map 60 cm horizontal surface displacement.',
    recommendedWorkflow: 'insar_deformation',
    recommendedPolarization: 'HH',
    recommendedProduct: 'GUNW',
    suggestedDates: {
      preEvent: '2026-06-18T00:00:00Z',
      postEvent: '2026-06-30T00:00:00Z',
    },
    keyLiterature: [
      {
        title: 'Where Venezuela’s Earthquakes Shifted the Ground',
        source: 'NASA Earth Observatory (10 July 2026)',
      },
      {
        title: 'USGS Finite-Fault Slip Model us6000t7zc & us6000t7zp',
        source: 'USGS Earthquake Hazards Program 2026',
      },
    ],
    storyChapters: [
      {
        id: 'v1',
        chapterNumber: 1,
        title: 'Urgent Response Activation',
        visualLabel: '12-Day Frequency A Co-pol GUNW Interferogram',
        scientificMessage: 'Unwrapped phase field Delta_phi_unw displays tight fringes across the San Sebastian strike-slip fault system.',
        physicalHypothesis: 'East-west strike-slip displacement shifted the southern block up to 60 cm westward along the coast north of Caracas.',
        corroborationSources: ['USGS PAGER Orange', 'NASA JPL NISAR Urgent Response Team'],
      },
      {
        id: 'v2',
        chapterNumber: 2,
        title: 'LOS Projection vs Vertical Uplift',
        visualLabel: 'Line-of-Sight Unit Vector decomposition (l = 40° incidence)',
        scientificMessage: 'Single-geometry radar measures range change along the look vector, not true vertical uplift. Motion toward sensor shortens range.',
        physicalHypothesis: 'Horizontal strike-slip vector projects strongly onto the 40° off-nadir line of sight, creating apparent range shortening on the eastern block.',
        corroborationSources: ['NASA Earth Observatory', 'JPL D-102274 Spec'],
      },
    ],
    precomputedStats: {
      baselineGamma0Db: -10.5,
      deltaGamma0Db: 0.4,
      waterAreaKm2Pre: 85.0,
      waterAreaKm2Post: 85.0,
      maxDisplacementMm: 584.0,
      losSignConvention: 'toward_sensor_positive',
      anomalyIndex: 0.94,
      sceiScore: 92.4,
      coherenceMean: 0.78,
      validFraction: 0.965,
      looksN: 100,
    },
    sampleGranules: [
      'NISAR_L2_UR_GUNW_026_042_A_088_40_SH_A_20260618T101230_20260630T101230_P05023_F_F_J_001.h5',
      'NISAR_L2_PR_GOFF_026_042_A_088_40_SH_A_20260618T101230_20260630T101230_P05023_P_F_J_001.h5',
    ],
  },
  {
    id: 'brahmaputra_floodplain',
    name: 'Brahmaputra Floodplain (Majuli & Kaziranga)',
    region: 'Assam, India',
    phenomenon: 'flood_inundation',
    phenomenonLabel: 'Monsoon Flood Wave & Fluvial Channel Shifting',
    bbox: [93.8, 26.5, 94.6, 27.2],
    center: [26.85, 94.2],
    zoom: 10,
    description: 'Braided river dynamics on the worlds largest river island. L-band SAR separates open turbulent floodwaters from inundated grasslands and elephant grass canopy inside Kaziranga National Park.',
    recommendedWorkflow: 'water_inundation',
    recommendedPolarization: 'HH',
    recommendedProduct: 'GCOV',
    suggestedDates: {
      preEvent: '2026-06-15T00:00:00Z',
      postEvent: '2026-08-20T00:00:00Z',
    },
    keyLiterature: [
      {
        title: 'Brahmaputra bank erosion & Brahmaputra Board Reports',
        source: 'Central Water Commission (India)',
      },
    ],
    storyChapters: [
      {
        id: 'b1',
        chapterNumber: 1,
        title: 'The Great Himalayan Silt Pulse',
        visualLabel: 'Otsu dark water threshold on 20m GCOV gamma0',
        scientificMessage: 'Submerged sand bars and braided river channel migration observed over 64-day interval.',
        physicalHypothesis: 'Peak glacier melt and monsoon rainfall combine to inundate 420 km² of low-lying floodplains.',
        corroborationSources: ['ISRO Bhoonidhi S-band', 'Central Water Commission'],
      },
    ],
    precomputedStats: {
      baselineGamma0Db: -12.4,
      deltaGamma0Db: -7.1,
      waterAreaKm2Pre: 340.0,
      waterAreaKm2Post: 512.4,
      anomalyIndex: 0.88,
      sceiScore: 89.0,
      coherenceMean: 0.45,
      validFraction: 0.972,
      looksN: 32,
    },
    sampleGranules: [
      'NISAR_L2_PR_GCOV_025_112_D_032_40_DH_A_20260615T011500_20260615T011536_P05023_P_F_J_001.h5',
      'NISAR_L2_PR_GCOV_031_112_D_032_40_DH_A_20260820T011500_20260820T011536_P05023_P_F_J_001.h5',
    ],
  },
  {
    id: 'chilika_lagoon',
    name: 'Chilika Coastal Lagoon',
    region: 'Odisha, India',
    phenomenon: 'wetland_extent',
    phenomenonLabel: 'Barrier Spit Inundation & Weed Bed Expansion',
    bbox: [85.1, 19.45, 85.65, 19.95],
    center: [19.7, 85.38],
    zoom: 11,
    description: 'Asias largest brackish wetland. Seasonal freshwater input through 52 rivers dilutes coastal salinity, prompting floating macrophytes and dynamic mouth opening across the Bay of Bengal sandspit.',
    recommendedWorkflow: 'water_inundation',
    recommendedPolarization: 'HH',
    recommendedProduct: 'GCOV',
    suggestedDates: {
      preEvent: '2026-07-02T00:00:00Z',
      postEvent: '2026-09-26T00:00:00Z',
    },
    keyLiterature: [
      {
        title: 'Chilika Development Authority Ecohydrology Report',
        source: 'CDA Ramsar Monitoring 2026',
      },
    ],
    storyChapters: [
      {
        id: 'k1',
        chapterNumber: 1,
        title: 'Estuarine Breathing Cycle',
        visualLabel: 'Macrophyte double-bounce vs specular open lagoon',
        scientificMessage: 'Weed bed extent increased by 22.4 km² while the sandspit inlet widened by 140 m.',
        physicalHypothesis: 'Monsoon discharge flushes nutrient-rich freshwater into northern channels.',
        corroborationSources: ['Ramsar Information Sheet', 'Survey of India'],
      },
    ],
    precomputedStats: {
      baselineGamma0Db: -16.2,
      deltaGamma0Db: -3.1,
      waterAreaKm2Pre: 720.0,
      waterAreaKm2Post: 764.0,
      anomalyIndex: 0.62,
      sceiScore: 68.4,
      coherenceMean: 0.69,
      validFraction: 0.994,
      looksN: 32,
    },
    sampleGranules: [
      'NISAR_L2_PR_GCOV_027_055_A_022_40_DH_A_20260702T014522_20260702T014558_P05023_P_F_J_001.h5',
      'NISAR_L2_PR_GCOV_034_055_A_022_40_DH_A_20260926T014522_20260926T014558_P05023_P_F_J_001.h5',
    ],
  },
  {
    id: 'gangotri_glacier',
    name: 'Gangotri Glacier Terminus',
    region: 'Uttarakhand, Himalayas',
    phenomenon: 'glacier_ice',
    phenomenonLabel: 'Glacial Velocity & Debris-Covered Ablation',
    bbox: [78.95, 30.8, 79.25, 31.05],
    center: [30.92, 79.1],
    zoom: 12,
    description: 'Source of the Bhagirathi River. Steep high-altitude terrain with heavy layover/shadow. Feature tracking and pixel offsets (GOFF) measure glacier flow velocity without phase unwrapping failure.',
    recommendedWorkflow: 'backscatter_change',
    recommendedPolarization: 'HH',
    recommendedProduct: 'GOFF',
    suggestedDates: {
      preEvent: '2026-06-10T00:00:00Z',
      postEvent: '2026-09-02T00:00:00Z',
    },
    keyLiterature: [
      {
        title: 'Geodetic mass balance of Gangotri Glacier from SAR and DEMs',
        source: 'Journal of Glaciology 2025',
      },
    ],
    storyChapters: [
      {
        id: 'g1',
        chapterNumber: 1,
        title: 'Downslope Ice Flow Tracking',
        visualLabel: 'Pixel offset magnitude d_slant / sin(theta)',
        scientificMessage: 'Mean terminus velocity measured at 28.5 m/year downvalley.',
        physicalHypothesis: 'Supraglacial debris insulates tongue while melt ponds enhance basal sliding.',
        corroborationSources: ['Wadia Institute of Himalayan Geology', 'Copernicus 30m DEM'],
      },
    ],
    precomputedStats: {
      baselineGamma0Db: -8.4,
      deltaGamma0Db: -1.8,
      waterAreaKm2Pre: 12.0,
      waterAreaKm2Post: 13.5,
      maxDisplacementMm: 120.0,
      anomalyIndex: 0.58,
      sceiScore: 61.2,
      coherenceMean: 0.38,
      validFraction: 0.82,
      looksN: 16,
    },
    sampleGranules: [
      'NISAR_L2_PR_GOFF_025_014_D_010_20_SH_A_20260610T001000_20260622T001000_P05023_P_P_J_001.h5',
      'NISAR_L2_PR_GOFF_032_014_D_010_20_SH_A_20260902T001000_20260914T001000_P05023_P_P_J_001.h5',
    ],
  },
];
