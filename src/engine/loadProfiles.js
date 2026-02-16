// Template load curves with customer-specific scaling

const TEMPLATES = {
  baseLoad:   [0.4, 0.3, 0.3, 0.3, 0.3, 0.4, 0.5, 0.6, 0.5, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.4, 0.4],
  hotWater:   [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 0.6, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.5, 0.3, 0.0, 0.0, 0.0, 0.0],
  cooking:    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.3, 0.2, 0.0, 0.0, 0.0, 0.8, 1.5, 1.2, 0.5, 0.0, 0.0, 0.0],
  evCharging: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.5, 1.5, 1.5, 1.0],
  lighting:   [0.1, 0.1, 0.0, 0.0, 0.0, 0.0, 0.1, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.3, 0.5, 0.5, 0.5, 0.4, 0.3],
  // Optional add-ons (added to baseLoad when toggled)
  pool:       [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  ac:         [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 1.0, 1.5, 1.5, 1.5, 1.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
}

export function generateLoadProfiles(customer) {
  // Start with base templates (deep copy)
  let baseLoad = [...TEMPLATES.baseLoad]
  let hotWater = customer.hasHotWater ? [...TEMPLATES.hotWater] : new Array(24).fill(0)
  const cooking = [...TEMPLATES.cooking]
  const evCharging = customer.hasEV ? [...TEMPLATES.evCharging] : new Array(24).fill(0)
  const lighting = [...TEMPLATES.lighting]

  // Add pool pump to baseLoad if customer has pool
  if (customer.hasPool) {
    for (let h = 0; h < 24; h++) baseLoad[h] += TEMPLATES.pool[h]
  }
  // Add AC to baseLoad if customer has AC
  if (customer.hasAC) {
    for (let h = 0; h < 24; h++) baseLoad[h] += TEMPLATES.ac[h]
  }

  // Sum raw total
  const rawTotal = new Array(24).fill(0)
  for (let h = 0; h < 24; h++) {
    rawTotal[h] = baseLoad[h] + hotWater[h] + cooking[h] + evCharging[h] + lighting[h]
  }
  const rawDailyTotal = rawTotal.reduce((a, b) => a + b, 0)

  // Scale factor to match customer's actual daily usage
  const dailyUsage = parseFloat(customer.dailyUsage) || 30
  const scaleFactor = dailyUsage / rawDailyTotal

  // Apply scale factor to all profiles
  const scaled = {
    baseLoad: baseLoad.map(v => v * scaleFactor),
    hotWater: hotWater.map(v => v * scaleFactor),
    cooking: cooking.map(v => v * scaleFactor),
    evCharging: evCharging.map(v => v * scaleFactor),
    lighting: lighting.map(v => v * scaleFactor),
  }

  // Build total load
  const totalLoad = new Array(24).fill(0)
  for (let h = 0; h < 24; h++) {
    totalLoad[h] = scaled.baseLoad[h] + scaled.hotWater[h] + scaled.cooking[h]
      + scaled.evCharging[h] + scaled.lighting[h]
  }

  return {
    ...scaled,
    totalLoad,
    dailyTotal: totalLoad.reduce((a, b) => a + b, 0),
  }
}
