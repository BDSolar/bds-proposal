// Main calculation engine — runs once after form submission
// Produces all numbers for Sections 1–8 plus 4 system option tiers
//
// SIZING PHILOSOPHY: Battery-First
// Battery is the anchor (150% of daily usage). Solar is sized to support it.

import {
  PANEL, BATTERY, SYSTEM_LOSSES,
  MIN_BATTERY_MODULES, FINANCIAL_DEFAULTS,
  NETWORK_LOOKUP, COVERAGE_TIERS,
  PANEL_PRICE, BATTERY_MODULE_PRICE, BATTERY_USABLE_PER_MODULE,
  INVERTERS, PV_INSTALL_PER_KW, BATTERY_INSTALL_PER_STACK,
  GP_MARGIN, COMMISSION_RATE, GST,
  STC_PRICE, STC_ZONE_RATING, STC_DEEMING,
  BATTERY_REBATE_PER_KWH, BATTERY_REBATE_MAX_KWH,
} from './constants'
import { generateLoadProfiles } from './loadProfiles'
import { lookupSolarZone, generateSolarCurve, getDailyProductionKwh } from './solarProduction'

// ── Auto-select cheapest inverter that fits the PV array ──
function autoSelectInverter(pvKw, phase) {
  const phaseKey = phase === 'Three' ? 'three' : 'single'
  const candidates = INVERTERS
    .filter(inv => inv.phases === phaseKey && inv.maxPvKw >= pvKw)
    .sort((a, b) => a.unitPrice - b.unitPrice)

  if (candidates.length > 0) return candidates[0]

  // Fallback: largest inverter for the phase type
  const fallback = INVERTERS
    .filter(inv => inv.phases === phaseKey)
    .sort((a, b) => b.maxPvKw - a.maxPvKw)
  return fallback[0]
}

// ── BDS pricing waterfall ──
function calculateSystemPrice(panelCount, pvKw, batteryModules, phase) {
  const panelsCost = panelCount * PANEL_PRICE
  const inverter = autoSelectInverter(pvKw, phase)
  const inverterCost = inverter.unitPrice
  const batteryCost = batteryModules * BATTERY_MODULE_PRICE
  const pvInstall = pvKw * PV_INSTALL_PER_KW
  const battInstall = batteryModules > 0 ? BATTERY_INSTALL_PER_STACK : 0

  const totalCog = panelsCost + inverterCost + batteryCost + pvInstall + battInstall

  const gpMargin = totalCog * GP_MARGIN
  const baseIncGst = (totalCog + gpMargin) * GST

  const stcRebate = Math.floor(pvKw * STC_ZONE_RATING * STC_DEEMING) * STC_PRICE
  const usableKwh = batteryModules * BATTERY_USABLE_PER_MODULE
  const batteryRebate = Math.min(usableKwh, BATTERY_REBATE_MAX_KWH) * BATTERY_REBATE_PER_KWH

  const commission = (baseIncGst - stcRebate - batteryRebate) * COMMISSION_RATE /
    (1 - COMMISSION_RATE * GST) / GST

  const priceIncGst = (totalCog + gpMargin + commission) * GST
  const customerPrice = Math.round(priceIncGst - stcRebate - batteryRebate)

  return {
    customerPrice,
    stcRebate,
    batteryRebate,
    totalRebates: stcRebate + batteryRebate,
    priceIncGst: Math.round(priceIncGst),
    inverterName: inverter.name,
  }
}

// ── Size battery (THE SYSTEM ANCHOR) ──
// Battery sized to 150% of total daily usage — same for all tiers
function sizeBattery(dailyUsage) {
  const requiredUsable = dailyUsage * 1.5
  let modules = Math.ceil(requiredUsable / (BATTERY.capacityPerModule * BATTERY.depthOfDischarge))
  modules = Math.max(MIN_BATTERY_MODULES, modules)

  const totalCapacity = modules * BATTERY.capacityPerModule
  const usableCapacity = totalCapacity * BATTERY.depthOfDischarge
  const maxChargeKw = Math.min(modules * BATTERY.maxChargeRatePerModule, BATTERY.inverterSize)
  const maxDischargeKw = Math.min(modules * BATTERY.maxDischargeRatePerModule, BATTERY.inverterSize)

  return { modules, totalCapacity, usableCapacity, maxChargeKw, maxDischargeKw }
}

// ── Size solar for a given coverage ratio ──
function sizeSolar(customer, loadProfiles, coverageRatio) {
  const dailyUsage = loadProfiles.dailyTotal
  const zone = lookupSolarZone(customer.postcode, customer.state)
  const psh = zone.psh
  const effectivePSH = psh * (1 - SYSTEM_LOSSES)

  const targetProduction = dailyUsage * coverageRatio
  const requiredKw = targetProduction / effectivePSH

  let panelCount = Math.ceil((requiredKw * 1000) / PANEL.wattage)
  panelCount = Math.max(panelCount, 10)

  const actualKw = (panelCount * PANEL.wattage) / 1000

  return {
    panelCount,
    actualKw,
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
  const dailyCost = (totalGridImport * tariffRate) + supplyCharge - (totalExported * fit)
  const annualCost = Math.round(Math.max(0, dailyCost) * 365)

  return {
    selfConsumption,
    exported,
    gridImport,
    totalSelfConsumed,
    totalExported,
    totalGridImport,
    selfConsumptionPct,
    dailyCost: Math.round(dailyCost * 100) / 100,
    annualCost,
  }
}

// ── Battery simulation (starts at FULL capacity — steady state) ──
function simulateBattery(totalLoad, solarCurve, batterySize) {
  const { usableCapacity, maxChargeKw, maxDischargeKw } = batterySize
  const efficiency = BATTERY.roundTripEfficiency
  // Battery starts FULL — previous day's solar charged it
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
  const selfPoweredPct = Math.min(100, Math.round(((totalSC + totalDischarged) / totalUsage) * 100))

  return {
    soc, charge, discharge, gridImport, gridExport, selfConsume,
    startSoc: Math.round(initialSoc * 10) / 10,
    endSoc: soc[23],
    totalGridImport,
    totalGridExport,
    totalCharged,
    totalDischarged,
    selfPoweredPct,
  }
}

// ── Financial projections ──
function calculateFinancials(customer, systemCost, batteryResults, tariffRate, supplyCharge) {
  const dailyUsage = parseFloat(customer.dailyUsage) || 30
  tariffRate = tariffRate || parseFloat(customer.tariffRate) || 0.32
  supplyCharge = supplyCharge || parseFloat(customer.supplyCharge) || 1.10
  const fit = FINANCIAL_DEFAULTS.fit
  const escalation = FINANCIAL_DEFAULTS.escalation
  const years = FINANCIAL_DEFAULTS.projectionYears
  const startYear = FINANCIAL_DEFAULTS.startYear
  const solarDegradation = PANEL.degradation

  const yearlyGridCost = []
  const yearlySavings = []
  const cumulativeGridCost = []
  const cumulativeSolarNet = []

  let gridCumulative = 0
  let savingsCumulative = 0

  for (let i = 0; i < years; i++) {
    const factor = Math.pow(1 + escalation, i)
    const escalatedRate = tariffRate * factor
    const escalatedSupply = supplyCharge * factor
    const gridAnnual = (dailyUsage * escalatedRate * 365) + (escalatedSupply * 365)

    const prodFactor = Math.pow(1 - solarDegradation, i)
    const dailyExport = batteryResults.totalGridExport * prodFactor
    const exportCredit = dailyExport * fit * 365
    const importCost = batteryResults.totalGridImport * escalatedRate * 365
    const supplyCost = escalatedSupply * 365
    // Allow negative cost (credit surplus)
    const solarAnnualCost = importCost + supplyCost - exportCredit

    const yearSavings = gridAnnual - Math.max(0, solarAnnualCost)

    gridCumulative += gridAnnual
    savingsCumulative += yearSavings

    yearlyGridCost.push(Math.round(gridAnnual))
    yearlySavings.push(Math.round(yearSavings))
    cumulativeGridCost.push(Math.round(gridCumulative))
    cumulativeSolarNet.push(Math.round(systemCost - savingsCumulative))
  }

  const paybackYear = cumulativeSolarNet.findIndex(v => v <= 0) + 1 || years
  const totalSavings = Math.round(savingsCumulative)
  const roi = Math.round(((totalSavings - systemCost) / systemCost) * 100)

  return {
    systemCost,
    yearlyGridCost,
    yearlySavings,
    cumulativeGridCost,
    cumulativeSolarNet,
    paybackYear,
    totalSavings20yr: totalSavings,
    roi,
    startYear,
    years,
  }
}

// ── Generate a complete system option for a given coverage ratio ──
function generateSystemOption(customer, loadProfiles, batterySize, coverageRatio) {
  const tariffRate = parseFloat(customer.tariffRate) || 0.32
  const supplyCharge = parseFloat(customer.supplyCharge) || 1.10
  const fit = FINANCIAL_DEFAULTS.fit
  const phase = customer.phase || 'Single'

  // 1. Size solar (battery is pre-sized — it's the anchor)
  const solar = sizeSolar(customer, loadProfiles, coverageRatio)

  // 2. Generate solar curve
  const solarCurve = generateSolarCurve(solar.actualKw, solar.psh)

  // 3. Solar-only sim
  const solarOnly = simulateSolarOnly(loadProfiles.totalLoad, solarCurve, tariffRate, supplyCharge, fit)

  // 4. Battery sim (starts FULL)
  const batteryResults = simulateBattery(loadProfiles.totalLoad, solarCurve, batterySize)

  // 5. Daily cost — allow negative (credit)
  const dailyImportCost = batteryResults.totalGridImport * tariffRate
  const dailyExportRevenue = batteryResults.totalGridExport * fit
  const dailyNetCost = dailyImportCost + supplyCharge - dailyExportRevenue
  const dailyCredit = Math.max(0, -dailyNetCost)
  const annualCost = Math.max(0, Math.round(dailyNetCost * 365))
  const annualCredit = Math.round(dailyCredit * 365)
  const fitRevenue = Math.round(dailyExportRevenue * 365)

  // 6. System price via BDS waterfall
  const pricing = calculateSystemPrice(
    solar.panelCount, solar.actualKw, batterySize.modules, phase
  )

  // 7. Financial projection
  const financial = calculateFinancials(customer, pricing.customerPrice, batteryResults, tariffRate, supplyCharge)

  // Combined systemSize object for downstream consumers
  const systemSize = {
    panelCount: solar.panelCount,
    actualKw: solar.actualKw,
    totalCapacity: batterySize.totalCapacity,
    usableCapacity: batterySize.usableCapacity,
    modules: batterySize.modules,
    maxChargeKw: batterySize.maxChargeKw,
    maxDischargeKw: batterySize.maxDischargeKw,
    zone: solar.zone,
    psh: solar.psh,
    dailyProduction: solar.dailyProduction,
  }

  return {
    coverageRatio,
    coveragePct: Math.round(coverageRatio * 100),
    panelCount: solar.panelCount,
    arrayKw: Math.round(solar.actualKw * 100) / 100,
    batteryModules: batterySize.modules,
    batteryKwh: batterySize.totalCapacity,
    usableKwh: Math.round(batterySize.usableCapacity * 10) / 10,
    systemPrice: pricing.customerPrice,
    stcRebate: pricing.stcRebate,
    batteryRebate: pricing.batteryRebate,
    totalRebates: pricing.totalRebates,
    inverterName: pricing.inverterName,
    dailyCost: Math.round(dailyNetCost * 100) / 100,
    dailyCredit: Math.round(dailyCredit * 100) / 100,
    annualCost,
    annualCredit,
    fitRevenue,
    dailyExport: Math.round(batteryResults.totalGridExport * 100) / 100,
    selfPoweredPct: batteryResults.selfPoweredPct,
    paybackYear: financial.paybackYear,
    savings20yr: financial.totalSavings20yr,
    roi: financial.roi,
    zeroBill: dailyNetCost <= 0,
    // Full sub-results for the recommended option
    solarOnly,
    battery: batteryResults,
    financial,
    systemSize,
    solarCurve,
  }
}

// ── Scenario builder ──
function buildScenarios(customer, solarOnly, batteryResults) {
  const dailyUsage = parseFloat(customer.dailyUsage) || 30
  const tariffRate = parseFloat(customer.tariffRate) || 0.32
  const supplyCharge = parseFloat(customer.supplyCharge) || 1.10
  const fit = FINANCIAL_DEFAULTS.fit

  const noSolarDaily = (dailyUsage * tariffRate) + supplyCharge
  const battDailyNet =
    (batteryResults.totalGridImport * tariffRate) + supplyCharge - (batteryResults.totalGridExport * fit)
  const battDailyCredit = Math.max(0, -battDailyNet)

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
      dailyCost: Math.round(battDailyNet * 100) / 100,
      annualCost: Math.max(0, Math.round(battDailyNet * 365)),
      annualCredit: Math.round(battDailyCredit * 365),
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
    sizing: {
      method: 'Battery-first',
      batteryRule: '150% of peak daily usage',
      solarRule: 'Daytime load + battery recharge + export buffer for supply charge offset',
      simStartCondition: 'Battery starts at full capacity (steady-state)',
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
      method: 'Battery-first sizing with export credit surplus',
      coverageRatio: Math.round((systemSize.dailyProduction / dailyUsage) * 100),
      guarantee: "If system doesn't zero bill, BDS pays the difference",
      term: 'Lifetime of system',
    },
  }
}

// ── Main entry point ──
export function calculateProposal(formData) {
  const customer = formData.customer
  const dailyUsage = parseFloat(customer.dailyUsage) || 30

  // 1. Generate load profiles (includes daytime/overnight split)
  const loadProfiles = generateLoadProfiles(customer)

  // 2. Size the battery FIRST — the system anchor (150% of daily usage)
  //    Same battery for all tiers
  const batterySize = sizeBattery(dailyUsage)

  // 3. Generate all 4 coverage tier options (solar varies, battery stays fixed)
  const options = COVERAGE_TIERS.map(ratio =>
    generateSystemOption(customer, loadProfiles, batterySize, ratio)
  )

  // 4. The 150% option is the recommended default (index 2)
  const recommended = options[2]
  const systemSize = recommended.systemSize

  // Add systemCost to systemSize for assumptions builder
  systemSize.systemCost = recommended.systemPrice

  // 5. Build output — top-level fields come from recommended option
  //    so S2-S6 need no changes
  const scenarios = buildScenarios(customer, recommended.solarOnly, recommended.battery)
  const system = buildSystemSpec(systemSize, customer)
  const assumptions = buildAssumptions(customer, systemSize, recommended.solarCurve)

  return {
    // Section 1
    yearlyBills: recommended.financial.yearlyGridCost,
    year1Bill: recommended.financial.yearlyGridCost[0],
    year20Bill: recommended.financial.yearlyGridCost[19],
    billIncreasePct: Math.round(((recommended.financial.yearlyGridCost[19] / recommended.financial.yearlyGridCost[0]) - 1) * 100),
    cumulativeBillNoSolar: recommended.financial.cumulativeGridCost[19],

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
    daytimeLoad: loadProfiles.daytimeLoad,
    overnightLoad: loadProfiles.overnightLoad,

    // Section 3
    solarProduction: recommended.solarCurve,

    // Section 3 (solar only)
    solarOnly: recommended.solarOnly,

    // Section 4 (battery)
    battery: recommended.battery,

    // Section 5 (scenarios)
    scenarios,

    // Section 6 (financials)
    financial: recommended.financial,

    // Section 7 (system + options)
    system,
    options,

    // Section 8 (assumptions)
    assumptions,
  }
}
