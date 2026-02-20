// Solar production curve generation — zone lookup + curve scaling

import {
  SOLAR_ZONES, STATE_DEFAULTS, REFERENCE_PSH,
  SOLAR_CURVE_NORMALISED, SYSTEM_LOSSES, SEASONAL_MULTIPLIERS
} from './constants'

export function lookupSolarZone(postcode, state) {
  const prefix = String(postcode).substring(0, 2)
  const zone = SOLAR_ZONES[prefix]
  if (zone) return zone

  // Fallback to state default
  const psh = STATE_DEFAULTS[state] || STATE_DEFAULTS.QLD
  return { zone: state || 'QLD', psh, state: state || 'QLD' }
}

export function generateSolarCurve(systemKw, peakSunHours) {
  const locationFactor = peakSunHours / REFERENCE_PSH
  return SOLAR_CURVE_NORMALISED.map(v => v * systemKw * locationFactor)
}

export function getDailyProductionKwh(systemKw, peakSunHours, orientationFactor = 1.0) {
  return systemKw * peakSunHours * (1 - SYSTEM_LOSSES) * orientationFactor
}

export function generateSolarCurveOriented(systemKw, peakSunHours, orientationFactor = 1.0) {
  const locationFactor = peakSunHours / REFERENCE_PSH
  return SOLAR_CURVE_NORMALISED.map(v => v * systemKw * locationFactor * orientationFactor)
}

export function getSeasonalProduction(systemKw, peakSunHours, orientationFactor, state) {
  const annual = getDailyProductionKwh(systemKw, peakSunHours, orientationFactor)
  const mult = SEASONAL_MULTIPLIERS[state] || SEASONAL_MULTIPLIERS.QLD
  return {
    annual: Math.round(annual * 10) / 10,
    summer: Math.round(annual * mult.summer * 10) / 10,
    winter: Math.round(annual * mult.winter * 10) / 10,
  }
}
