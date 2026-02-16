// 24-hour solar production profile for a 13.2 kW system (kWh per hour)
export const solarRaw = [
  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,
  0.1,  0.8,  2.2,  4.2,  6.0,  7.2,
  7.8,  7.5,  6.5,  5.0,  3.2,  1.4,
  0.2,  0.0,  0.0,  0.0,  0.0,  0.0,
]

// Per-kW production curve (used for scaling to any system size)
export const solarPerKW = [
  0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
  0.0076, 0.0606, 0.1667, 0.3182, 0.4545, 0.5455,
  0.5909, 0.5682, 0.4924, 0.3788, 0.2424, 0.1061,
  0.0152, 0.0, 0.0, 0.0, 0.0, 0.0,
]

export function getSolarForSystemSize(kw) {
  return solarPerKW.map(v => Math.round(v * kw * 10) / 10)
}

export function getDailyProduction(profile = solarRaw) {
  return profile.reduce((a, b) => a + b, 0)
}
