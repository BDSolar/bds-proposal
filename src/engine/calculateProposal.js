// Main calculation engine — runs once after form submission
// Produces all numbers for Sections 1–8

import {
  PANEL, BATTERY, SYSTEM_LOSSES, COVERAGE_RATIO,
  MIN_BATTERY_MODULES, PRICING, FINANCIAL_DEFAULTS,
  NETWORK_LOOKUP,
} from './constants'
import { generateLoadProfiles } from './loadProfiles'
import { lookupSolarZone, generateSolarCurve, getDailyProductionKwh } from './solarProduction'

// ── System sizing (150% rule) ──
function sizeSystem(customer, loadProfiles) {
  const dailyUsage = loadProfiles.dailyTotal
  const zone = lookupSolarZone(customer.postcode, customer.state)
  const psh = zone.psh
  const effectivePSH = psh * (1 - SYSTEM_LOSSES)

  // 150% target production
  const targetProduction = dailyUsage * COVERAGE_RATIO

  // Required kW
  const requiredKw = targetProduction / effectivePSH

  // Panel count (round up to nearest panel)
  let panelCount = Math.ceil((requiredKw * 1000) / PANEL.wattage)
  panelCount = Math.max(panelCount, 10) // minimum 10 panels

  const actualKw = (panelCount * PANEL.wattage) / 1000

  // Battery sizing — cover evening/night usage with 10% buffer
  const solarCurve = generateSolarCurve(actualKw, psh)
  let eveningUsage = 0
  for (let h = 0; h < 24; h++) {
    if (solarCurve[h] < 0.1) { // effectively no solar
      eveningUsage += loadProfiles.totalLoad[h]
    }
  }
  const requiredUsable = eveningUsage * 1.1
  let modules = Math.ceil(requiredUsable / (BATTERY.capacityPerModule * BATTERY.depthOfDischarge))
  modules = Math.max(MIN_BATTERY_MODULES, modules)

  const totalCapacity = modules * BATTERY.capacityPerModule
  const usableCapacity = totalCapacity * BATTERY.depthOfDischarge
  const maxChargeKw = Math.min(modules * BATTERY.maxChargeRatePerModule, BATTERY.inverterSize)
  const maxDischargeKw = Math.min(modules * BATTERY.maxDischargeRatePerModule, BATTERY.inverterSize)

  // System cost
  const rawCost = (actualKw * PRICING.solarPerKw) + (totalCapacity * PRICING.batteryPerKwh) + PRICING.baseInstall
  const systemCost = Math.round(rawCost / 500) * 500

  return {
    panelCount,
    actualKw,
    totalCapacity,
    usableCapacity,
    modules,
    maxChargeKw,
    maxDischargeKw,
    systemCost,
    zone,
    psh,
    dailyProduction: getDailyProductionKwh(actualKw, psh),
  }
}

// ── Solar-only simulation ──
function simulateSolarOnly(totalLoad, solarCurve, tariffRate, supplyCharge, fit) {
  const selfConsumption = []
  const exported = []
  const gridImport = []

  for (let h = 0; h < 24; h++) {
    const sc = Math.min(totalLoad[h], solarCurve[h])
    const exp = Math.max(solarCurve[h] - totalLoad[h], 0)
    const gi = Math.max(totalLoad[h] - solarCurve[h], 0)
    selfConsumption.push(sc)
    exported.push(exp)
    gridImport.push(gi)
  }

  const totalSelfConsumed = selfConsumption.reduce((a, b) => a + b, 0)
  const totalExported = exported.reduce((a, b) => a + b, 0)
  const totalGridImport = gridImport.reduce((a, b) => a + b, 0)
  const totalSolar = solarCurve.reduce((a, b) => a + b, 0)
  const selfConsumptionPct = totalSolar > 0 ? Math.round((totalSelfConsumed / totalSolar) * 100) : 0
  const dailyCost = Math.max(0, (totalGridImport * tariffRate) + supplyCharge - (totalExported * fit))
  const annualCost = Math.round(dailyCost * 365)

  return {
    selfConsumption,
    exported,
    gridImport,
    totalSelfConsumed,
    totalExported,
    totalGridImport,
    selfConsumptionPct,
    dailyCost,
    annualCost,
  }
}

// ── Battery simulation ──
function simulateBattery(totalLoad, solarCurve, systemSize) {
  const { usableCapacity, maxChargeKw, maxDischargeKw } = systemSize
  const efficiency = BATTERY.roundTripEfficiency
  const initialSoc = usableCapacity * BATTERY.initialSocPct

  const soc = []
  const charge = []
  const discharge = []
  const gridImport = []
  const gridExport = []
  const selfConsume = []

  let currentSoc = initialSoc

  for (let h = 0; h < 24; h++) {
    const load = totalLoad[h]
    const solar = solarCurve[h]
    const net = solar - load
    const sc = Math.min(load, solar)

    let ch = 0, dis = 0, gi = 0, ge = 0

    if (net > 0) {
      const canCharge = Math.min(net, maxChargeKw, (usableCapacity - currentSoc) / efficiency)
      ch = Math.max(0, canCharge)
      currentSoc = Math.min(currentSoc + ch * efficiency, usableCapacity)
      ge = net - ch
    } else if (net < 0) {
      const deficit = -net
      const canDischarge = Math.min(deficit, maxDischargeKw, currentSoc)
      dis = Math.max(0, canDischarge)
      currentSoc = Math.max(0, currentSoc - dis)
      gi = deficit - dis
    }

    soc.push(Math.round(currentSoc * 100) / 100)
    charge.push(Math.round(ch * 100) / 100)
    discharge.push(Math.round(dis * 100) / 100)
    gridImport.push(Math.round(gi * 100) / 100)
    gridExport.push(Math.round(ge * 100) / 100)
    selfConsume.push(Math.round(sc * 100) / 100)
  }

  const totalGridImport = gridImport.reduce((a, b) => a + b, 0)
  const totalGridExport = gridExport.reduce((a, b) => a + b, 0)
  const totalCharged = charge.reduce((a, b) => a + b, 0)
  const totalDischarged = discharge.reduce((a, b) => a + b, 0)
  const totalSC = selfConsume.reduce((a, b) => a + b, 0)
  const totalUsage = totalLoad.reduce((a, b) => a + b, 0)
  const selfPoweredPct = Math.round(((totalSC + totalDischarged) / totalUsage) * 100)

  return {
    soc, charge, discharge, gridImport, gridExport, selfConsume,
    totalGridImport, totalGridExport, totalCharged, totalDischarged,
    selfPoweredPct,
  }
}

// ── Bill-to-zero verification loop ──
function verifyBillToZero(totalLoad, customer, systemSize) {
  const tariffRate = parseFloat(customer.tariffRate) || 0.32
  const supplyCharge = parseFloat(customer.supplyCharge) || 1.10
  const fit = FINANCIAL_DEFAULTS.fit
  let { panelCount, actualKw } = systemSize
  const zone = systemSize.zone

  let attempts = 0
  while (attempts < 20) {
    const solarCurve = generateSolarCurve(actualKw, zone.psh)
    const battResult = simulateBattery(totalLoad, solarCurve, systemSize)

    const dailyExportRevenue = battResult.totalGridExport * fit
    const dailyImportCost = battResult.totalGridImport * tariffRate
    const dailyNetCost = dailyImportCost + supplyCharge - dailyExportRevenue

    if (dailyNetCost <= 0) break

    // Add a panel and recalculate
    panelCount += 1
    actualKw = (panelCount * PANEL.wattage) / 1000
    systemSize = {
      ...systemSize,
      panelCount,
      actualKw,
      dailyProduction: getDailyProductionKwh(actualKw, zone.psh),
    }
    // Recalculate system cost
    const rawCost = (actualKw * PRICING.solarPerKw) + (systemSize.totalCapacity * PRICING.batteryPerKwh) + PRICING.baseInstall
    systemSize.systemCost = Math.round(rawCost / 500) * 500
    attempts++
  }

  return systemSize
}

// ── Financial projections ──
function calculateFinancials(customer, systemSize, batteryResults) {
  const dailyUsage = parseFloat(customer.dailyUsage) || 30
  const tariffRate = parseFloat(customer.tariffRate) || 0.32
  const supplyCharge = parseFloat(customer.supplyCharge) || 1.10
  const fit = FINANCIAL_DEFAULTS.fit
  const escalation = FINANCIAL_DEFAULTS.escalation
  const years = FINANCIAL_DEFAULTS.projectionYears
  const startYear = FINANCIAL_DEFAULTS.startYear
  const systemCost = systemSize.systemCost
  const solarDegradation = PANEL.degradation

  const yearlyGridCost = []
  const yearlySolarSavings = []
  const cumulativeGridCost = []
  const cumulativeSolarNet = []

  let gridCumulative = 0
  let savingsCumulative = 0

  for (let i = 0; i < years; i++) {
    const factor = Math.pow(1 + escalation, i)
    const escalatedRate = tariffRate * factor
    const escalatedSupply = supplyCharge * factor
    const gridAnnual = (dailyUsage * escalatedRate * 365) + (escalatedSupply * 365)

    // Solar+battery: exports degrade, but cover supply charge
    const prodFactor = Math.pow(1 - solarDegradation, i)
    const dailyExport = batteryResults.totalGridExport * prodFactor
    const exportCredit = dailyExport * fit * 365
    const importCost = batteryResults.totalGridImport * escalatedRate * 365
    const supplyCost = escalatedSupply * 365
    const solarAnnualCost = Math.max(0, importCost + supplyCost - exportCredit)

    const yearSavings = gridAnnual - solarAnnualCost

    gridCumulative += gridAnnual
    savingsCumulative += yearSavings

    yearlyGridCost.push(Math.round(gridAnnual))
    yearlySolarSavings.push(Math.round(yearSavings))
    cumulativeGridCost.push(Math.round(gridCumulative))
    cumulativeSolarNet.push(Math.round(systemCost - savingsCumulative))
  }

  const paybackYear = cumulativeSolarNet.findIndex(v => v <= 0) + 1 || years
  const totalSavings = Math.round(savingsCumulative)
  const roi = Math.round(((totalSavings - systemCost) / systemCost) * 100)

  return {
    systemCost,
    yearlyGridCost,
    yearlySolarSavings,
    cumulativeGridCost,
    cumulativeSolarNet,
    paybackYear,
    totalSavings20yr: totalSavings,
    roi,
    startYear,
    years,
  }
}

// ── Scenario builder ──
function buildScenarios(customer, solarOnly, batteryResults) {
  const dailyUsage = parseFloat(customer.dailyUsage) || 30
  const tariffRate = parseFloat(customer.tariffRate) || 0.32
  const supplyCharge = parseFloat(customer.supplyCharge) || 1.10
  const fit = FINANCIAL_DEFAULTS.fit

  const noSolarDaily = (dailyUsage * tariffRate) + supplyCharge
  const battDaily = Math.max(0,
    (batteryResults.totalGridImport * tariffRate) + supplyCharge - (batteryResults.totalGridExport * fit)
  )

  return {
    noSolar: {
      dailyCost: Math.round(noSolarDaily * 100) / 100,
      annualCost: Math.round(noSolarDaily * 365),
      selfPoweredPct: 0,
    },
    solarOnly: {
      dailyCost: solarOnly.dailyCost,
      annualCost: solarOnly.annualCost,
      selfPoweredPct: solarOnly.selfConsumptionPct,
    },
    solarBattery: {
      dailyCost: Math.round(battDaily * 100) / 100,
      annualCost: Math.round(battDaily * 365),
      selfPoweredPct: batteryResults.selfPoweredPct,
    },
  }
}

// ── System spec builder ──
function buildSystemSpec(systemSize, customer) {
  return {
    panels: {
      brand: PANEL.brand,
      model: PANEL.model,
      series: PANEL.series,
      technology: PANEL.technology,
      wattage: PANEL.wattage,
      efficiency: PANEL.efficiency,
      panelCount: systemSize.panelCount,
      totalKw: Math.round(systemSize.actualKw * 100) / 100,
      warranty: `${PANEL.warrantyProduct} + ${PANEL.warrantyPerformance}yr`,
      tempCoeff: PANEL.tempCoeff,
      degradation: PANEL.degradation * 100,
      cellType: PANEL.cellType,
    },
    battery: {
      brand: BATTERY.brand,
      model: BATTERY.model,
      modules: systemSize.modules,
      capacityPerModule: BATTERY.capacityPerModule,
      totalCapacity: systemSize.totalCapacity,
      usableCapacity: Math.round(systemSize.usableCapacity * 10) / 10,
      chemistry: BATTERY.chemistry,
      cycles: BATTERY.cycles,
      warranty: BATTERY.warranty,
      inverterSize: BATTERY.inverterSize,
      evCharger: !!customer.hasEV,
      evChargerKw: BATTERY.evChargerKw,
      ip: BATTERY.ip,
      features: BATTERY.features,
    },
    coverageRatio: Math.round((systemSize.dailyProduction / (parseFloat(customer.dailyUsage) || 30)) * 100),
    dailyProduction: Math.round(systemSize.dailyProduction * 100) / 100,
  }
}

// ── Assumptions builder ──
function buildAssumptions(customer, systemSize, solarCurve) {
  const tariffRate = parseFloat(customer.tariffRate) || 0.32
  const supplyCharge = parseFloat(customer.supplyCharge) || 1.10
  const dailyUsage = parseFloat(customer.dailyUsage) || 30
  const prefix = String(customer.postcode).substring(0, 2)

  return {
    tariff: {
      rate: tariffRate,
      supply: supplyCharge,
      fit: FINANCIAL_DEFAULTS.fit,
      escalation: FINANCIAL_DEFAULTS.escalation,
      tariffType: 'Single Rate (Flat)',
      network: NETWORK_LOOKUP[prefix] || 'Unknown',
      retailer: 'Current Retailer',
    },
    solar: {
      brand: PANEL.brand,
      model: PANEL.model,
      wattage: PANEL.wattage,
      panelCount: systemSize.panelCount,
      totalKw: Math.round(systemSize.actualKw * 100) / 100,
      efficiency: PANEL.efficiency,
      technology: PANEL.technology,
      orientation: 'North',
      tilt: 20,
      peakSunHours: systemSize.psh,
      dailyProduction: Math.round(systemSize.dailyProduction * 100) / 100,
      annualProduction: Math.round(systemSize.dailyProduction * 365),
      systemLosses: SYSTEM_LOSSES * 100,
      location: `${customer.suburb || ''}, ${customer.state || 'QLD'}`.replace(/^, /, ''),
    },
    battery: {
      brand: BATTERY.brand,
      model: BATTERY.model,
      totalCapacity: systemSize.totalCapacity,
      usableCapacity: Math.round(systemSize.usableCapacity * 10) / 10,
      modules: systemSize.modules,
      capacityPerModule: BATTERY.capacityPerModule,
      chemistry: BATTERY.chemistry,
      cycles: BATTERY.cycles,
      inverterSize: BATTERY.inverterSize,
      evChargerKw: BATTERY.evChargerKw,
      roundTripEfficiency: BATTERY.roundTripEfficiency * 100,
      depthOfDischarge: BATTERY.depthOfDischarge * 100,
    },
    degradation: {
      solar: PANEL.degradation * 100,
      battery: BATTERY.degradationAnnual * 100,
    },
    financial: {
      systemCost: systemSize.systemCost,
      annualUsage: Math.round(dailyUsage * 365),
      years: FINANCIAL_DEFAULTS.projectionYears,
    },
    guarantee: {
      type: 'Bill-to-Zero',
      coverageRatio: Math.round((systemSize.dailyProduction / dailyUsage) * 100),
      guarantee: "If system doesn't zero bill, BDS pays the difference",
      term: 'Lifetime of system',
    },
  }
}

// ── Main entry point ──
export function calculateProposal(formData) {
  const customer = formData.customer

  // 1. Generate load profiles
  const loadProfiles = generateLoadProfiles(customer)

  // 2. Size the system (150% rule)
  let systemSize = sizeSystem(customer, loadProfiles)

  // 3. Generate solar production curve
  const solarCurve = generateSolarCurve(systemSize.actualKw, systemSize.psh)

  // 4. Solar-only simulation
  const tariffRate = parseFloat(customer.tariffRate) || 0.32
  const supplyCharge = parseFloat(customer.supplyCharge) || 1.10
  const fit = FINANCIAL_DEFAULTS.fit
  const solarOnly = simulateSolarOnly(loadProfiles.totalLoad, solarCurve, tariffRate, supplyCharge, fit)

  // 5. Battery simulation
  const batteryResults = simulateBattery(loadProfiles.totalLoad, solarCurve, systemSize)

  // 6. Bill-to-zero verification — add panels if needed
  systemSize = verifyBillToZero(loadProfiles.totalLoad, customer, systemSize)

  // Re-run sims with final system size if panels were added
  const finalSolarCurve = generateSolarCurve(systemSize.actualKw, systemSize.psh)
  const finalSolarOnly = simulateSolarOnly(loadProfiles.totalLoad, finalSolarCurve, tariffRate, supplyCharge, fit)
  const finalBattery = simulateBattery(loadProfiles.totalLoad, finalSolarCurve, systemSize)

  // 7. Financial projections
  const financial = calculateFinancials(customer, systemSize, finalBattery)

  // 8. Build output
  const scenarios = buildScenarios(customer, finalSolarOnly, finalBattery)
  const system = buildSystemSpec(systemSize, customer)
  const assumptions = buildAssumptions(customer, systemSize, finalSolarCurve)

  return {
    // Section 1
    yearlyBills: financial.yearlyGridCost,
    year1Bill: financial.yearlyGridCost[0],
    year20Bill: financial.yearlyGridCost[19],
    billIncreasePct: Math.round(((financial.yearlyGridCost[19] / financial.yearlyGridCost[0]) - 1) * 100),
    cumulativeBillNoSolar: financial.cumulativeGridCost[19],

    // Section 2
    loadProfiles: {
      baseLoad: loadProfiles.baseLoad,
      hotWater: loadProfiles.hotWater,
      cooking: loadProfiles.cooking,
      evCharging: loadProfiles.evCharging,
      lighting: loadProfiles.lighting,
    },
    totalLoad: loadProfiles.totalLoad,
    dailyTotal: loadProfiles.dailyTotal,

    // Section 3
    solarProduction: finalSolarCurve,

    // Section 3 (solar only)
    solarOnly: finalSolarOnly,

    // Section 4 (battery)
    battery: finalBattery,

    // Section 5 (scenarios)
    scenarios,

    // Section 6 (financials)
    financial,

    // Section 7 (system)
    system,

    // Section 8 (assumptions)
    assumptions,
  }
}
