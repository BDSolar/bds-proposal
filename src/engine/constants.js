// Hardware specs, solar zones, pricing defaults

export const PANEL = {
  brand: 'LONGi',
  model: 'Hi-MO X10',
  series: 'EcoLife',
  technology: 'HPBC 2.0',
  wattage: 475,
  efficiency: 24.3,
  cellType: 'N-type BC',
  tempCoeff: -0.26,
  degradation: 0.0035, // 0.35%/yr
  warrantyProduct: 15,
  warrantyPerformance: 30,
}

export const BATTERY = {
  brand: 'SigEnergy',
  model: 'SigenStor',
  capacityPerModule: 8, // kWh per module
  depthOfDischarge: 0.95,
  maxChargeRatePerModule: 2.5, // kW per module
  maxDischargeRatePerModule: 2.5,
  roundTripEfficiency: 0.95,
  inverterSize: 10, // kW (caps charge/discharge)
  initialSocPct: 1.0, // start sim at FULL capacity (steady-state — previous day's solar charged it)
  chemistry: 'LiFePO\u2084',
  cycles: '10,000+',
  warranty: '10yr',
  evChargerKw: 12.5,
  ip: 'IP66',
  degradationAnnual: 0.015, // 1.5%/yr
  features: ['Hybrid Inverter', 'EV DC Charger', 'Battery PCS', 'EMS', 'Blackout Backup'],
}

export const SYSTEM_LOSSES = 0.14 // 14% (inverter, wiring, soiling, temp derating)
export const COVERAGE_RATIO = 1.5 // 150% rule
export const MIN_PANELS = 10
export const MIN_BATTERY_MODULES = 2
export const MAX_KW_SINGLE_PHASE = 30
export const MAX_KW_THREE_PHASE = 30

// ── Real BDS pricing model ──
export const PANEL_PRICE = 121.13 // ex-GST per panel (LONGi X10 475W via Raystech)

export const BATTERY_MODULE_PRICE = 3632 // ex-GST per 8kWh Sigenergy module
export const BATTERY_USABLE_PER_MODULE = 7.8 // kWh usable per module

// Sigenergy Energy Controllers (ex-GST)
export const INVERTERS = [
  // Single Phase
  { id: 'sig-ec-5sp',  name: 'SigenStor EC 5.0 SP',  phases: 'single', maxPvKw: 10, unitPrice: 1343 },
  { id: 'sig-ec-6sp',  name: 'SigenStor EC 6.0 SP',  phases: 'single', maxPvKw: 12, unitPrice: 1452 },
  { id: 'sig-ec-8sp',  name: 'SigenStor EC 8.0 SP',  phases: 'single', maxPvKw: 16, unitPrice: 2482 },
  { id: 'sig-ec-10sp', name: 'SigenStor EC 10.0 SP', phases: 'single', maxPvKw: 20, unitPrice: 2675 },
  { id: 'sig-ec-12sp', name: 'SigenStor EC 12.0 SP', phases: 'single', maxPvKw: 24, unitPrice: 2869 },
  // Three Phase
  { id: 'sig-ec-5tp',  name: 'SigenStor EC 5.0 TP',  phases: 'three', maxPvKw: 8,  unitPrice: 2300 },
  { id: 'sig-ec-10tp', name: 'SigenStor EC 10.0 TP', phases: 'three', maxPvKw: 16, unitPrice: 2663 },
  { id: 'sig-ec-15tp', name: 'SigenStor EC 15.0 TP', phases: 'three', maxPvKw: 24, unitPrice: 3511 },
  { id: 'sig-ec-20tp', name: 'SigenStor EC 20.0 TP', phases: 'three', maxPvKw: 32, unitPrice: 4007 },
  { id: 'sig-ec-25tp', name: 'SigenStor EC 25.0 TP', phases: 'three', maxPvKw: 40, unitPrice: 4600 },
  { id: 'sig-ec-30tp', name: 'SigenStor EC 30.0 TP', phases: 'three', maxPvKw: 48, unitPrice: 5060 },
]

export const PV_INSTALL_PER_KW = 300 // ex-GST
export const BATTERY_INSTALL_PER_STACK = 1600 // ex-GST per stack

export const GP_MARGIN = 0.375 // 37.5%
export const COMMISSION_RATE = 0.0875 // 8.75%
export const GST = 1.1

export const STC_PRICE = 37
export const STC_DEEMING = 5

// STC zone ratings by postcode prefix (Clean Energy Regulator zones)
export const STC_ZONE_RATINGS = {
  // Zone 1 (tropical) — 1.622
  '08': 1.622, // Darwin NT
  // Zone 2 (subtropical) — 1.536
  '45': 1.536, '46': 1.536, '47': 1.536, '48': 1.536, '49': 1.536, // North QLD
  // Zone 3 (temperate) — 1.382
  '20': 1.382, '21': 1.382, '22': 1.382, '23': 1.382, '24': 1.382,
  '25': 1.382, '26': 1.382, '28': 1.382, '29': 1.382, // NSW/ACT
  '40': 1.382, '41': 1.382, '42': 1.382, '43': 1.382, '44': 1.382, // SE QLD
  '50': 1.382, '51': 1.382, '52': 1.382, // SA
  '60': 1.382, '61': 1.382, '62': 1.382, // WA
  // Zone 4 (cool) — 1.185
  '30': 1.185, '31': 1.185, '32': 1.185, '33': 1.185, '34': 1.185, '35': 1.185, '36': 1.185, // VIC
  '70': 1.185, '71': 1.185, // TAS
}
export const STC_ZONE_DEFAULT = 1.382 // fallback

export const BATTERY_REBATE_PER_KWH = 311
export const BATTERY_REBATE_MAX_KWH = 50

export const COVERAGE_TIERS = [1.0, 1.25, 1.5, 1.75]

export const FINANCIAL_DEFAULTS = {
  escalation: 0.05, // 5% p.a.
  projectionYears: 20,
  startYear: 2026,
}

// State-based FiT defaults ($/kWh)
export const FIT_DEFAULTS = {
  QLD: 0.07, NSW: 0.05, VIC: 0.05, SA: 0.05,
  WA: 0.025, TAS: 0.089, NT: 0.085, ACT: 0.06,
}

// Roof orientation production multipliers
export const ORIENTATION_FACTORS = {
  'North': 1.0,
  'North-East': 0.95,
  'North-West': 0.95,
  'East': 0.85,
  'West': 0.85,
  'South-East': 0.80,
  'South-West': 0.80,
  'Mixed': 0.90,
}

// Seasonal PSH multipliers by state (summer Dec-Feb, winter Jun-Aug)
// Higher latitudes have bigger variation; tropical zones are flatter
export const SEASONAL_MULTIPLIERS = {
  QLD: { summer: 1.20, winter: 0.82 },
  NSW: { summer: 1.28, winter: 0.74 },
  ACT: { summer: 1.30, winter: 0.72 },
  VIC: { summer: 1.35, winter: 0.65 },
  SA:  { summer: 1.30, winter: 0.72 },
  WA:  { summer: 1.25, winter: 0.78 },
  TAS: { summer: 1.38, winter: 0.62 },
  NT:  { summer: 1.10, winter: 0.92 },
}

// Normalised solar curve (reference: Sydney PSH 4.2)
// Fraction of 1kW nameplate output per hour. Sum ~= 3.95
export const SOLAR_CURVE_NORMALISED = [
  0, 0, 0, 0, 0, 0,
  0.008, 0.061, 0.167,
  0.318, 0.455, 0.545,
  0.591, 0.568, 0.492,
  0.379, 0.242, 0.106,
  0.015, 0, 0, 0, 0, 0,
]
export const REFERENCE_PSH = 4.2 // Sydney baseline

// Solar zones — postcode prefix → { zone, psh, state }
export const SOLAR_ZONES = {
  '20': { zone: 'Sydney', psh: 4.2, state: 'NSW' },
  '21': { zone: 'Sydney', psh: 4.2, state: 'NSW' },
  '22': { zone: 'Sydney', psh: 4.2, state: 'NSW' },
  '23': { zone: 'Wollongong', psh: 4.1, state: 'NSW' },
  '24': { zone: 'South Coast', psh: 4.0, state: 'NSW' },
  '25': { zone: 'Canberra', psh: 4.3, state: 'ACT' },
  '26': { zone: 'Canberra', psh: 4.3, state: 'ACT' },
  '28': { zone: 'Hunter', psh: 4.3, state: 'NSW' },
  '29': { zone: 'North NSW', psh: 4.5, state: 'NSW' },
  '30': { zone: 'Melbourne', psh: 3.6, state: 'VIC' },
  '31': { zone: 'Melbourne', psh: 3.6, state: 'VIC' },
  '32': { zone: 'Melbourne', psh: 3.6, state: 'VIC' },
  '33': { zone: 'Geelong', psh: 3.7, state: 'VIC' },
  '34': { zone: 'Gippsland', psh: 3.5, state: 'VIC' },
  '35': { zone: 'West VIC', psh: 3.8, state: 'VIC' },
  '36': { zone: 'North VIC', psh: 4.0, state: 'VIC' },
  '40': { zone: 'Brisbane', psh: 4.8, state: 'QLD' },
  '41': { zone: 'Brisbane', psh: 4.8, state: 'QLD' },
  '42': { zone: 'Gold Coast', psh: 4.7, state: 'QLD' },
  '43': { zone: 'Sunshine Coast', psh: 4.9, state: 'QLD' },
  '44': { zone: 'Toowoomba', psh: 4.8, state: 'QLD' },
  '45': { zone: 'Townsville', psh: 5.2, state: 'QLD' },
  '46': { zone: 'Mackay', psh: 5.1, state: 'QLD' },
  '47': { zone: 'Rockhampton', psh: 5.0, state: 'QLD' },
  '48': { zone: 'Cairns', psh: 5.0, state: 'QLD' },
  '49': { zone: 'Far North QLD', psh: 5.0, state: 'QLD' },
  '50': { zone: 'Adelaide', psh: 4.4, state: 'SA' },
  '51': { zone: 'Adelaide', psh: 4.4, state: 'SA' },
  '52': { zone: 'Adelaide Hills', psh: 4.3, state: 'SA' },
  '60': { zone: 'Perth', psh: 5.0, state: 'WA' },
  '61': { zone: 'Perth', psh: 5.0, state: 'WA' },
  '62': { zone: 'Perth South', psh: 5.0, state: 'WA' },
  '70': { zone: 'Hobart', psh: 3.5, state: 'TAS' },
  '71': { zone: 'Launceston', psh: 3.6, state: 'TAS' },
  '08': { zone: 'Darwin', psh: 5.4, state: 'NT' },
}

export const STATE_DEFAULTS = {
  NSW: 4.2, VIC: 3.6, QLD: 4.8, SA: 4.4, WA: 5.0, TAS: 3.5, NT: 5.4, ACT: 4.3,
}

export const NETWORK_LOOKUP = {
  '20': 'Ausgrid', '21': 'Ausgrid', '22': 'Ausgrid',
  '23': 'Endeavour Energy', '25': 'Evoenergy', '26': 'Evoenergy',
  '28': 'Ausgrid', '29': 'Essential Energy',
  '30': 'CitiPower', '31': 'United Energy', '32': 'Jemena',
  '33': 'Powercor', '34': 'AusNet',
  '40': 'Energex', '41': 'Energex', '42': 'Energex',
  '43': 'Energex', '44': 'Ergon', '45': 'Ergon',
  '46': 'Ergon', '47': 'Ergon', '48': 'Ergon', '49': 'Ergon',
  '50': 'SA Power Networks', '51': 'SA Power Networks', '52': 'SA Power Networks',
  '60': 'Western Power', '61': 'Western Power', '62': 'Western Power',
  '70': 'TasNetworks', '71': 'TasNetworks',
  '08': 'Power and Water',
}
