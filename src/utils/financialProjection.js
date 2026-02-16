// 20-year financial projection — grid-only vs solar+battery cumulative costs
export function project20Years(params = {}) {
  const {
    dailyUsage = 30,
    rate = 0.32,
    supply = 1.10,
    fit = 0.05,
    escalation = 0.05,
    systemCost = 28500,
    degradation = 0.005,
    years = 20,
    startYear = 2026,
    dailySolarProduction = 65.25,
    selfConsumptionPct = 1.0,
    dailyExportKwh = 35.25,
  } = params

  const data = []
  let gridCumulative = 0
  let solarCumulative = systemCost

  for (let i = 0; i < years; i++) {
    const factor = Math.pow(1 + escalation, i)
    const gridAnnual = (dailyUsage * rate * factor * 365) + (supply * factor * 365)

    // Solar system: degradation reduces production, FiT credits offset supply charge
    const prodFactor = Math.pow(1 - degradation, i)
    const dailyExport = dailyExportKwh * prodFactor
    const exportCredit = dailyExport * fit * factor * 365
    const supplyAnnual = supply * factor * 365
    const solarAnnualCost = Math.max(0, supplyAnnual - exportCredit) * (1 - selfConsumptionPct)

    gridCumulative += gridAnnual
    solarCumulative += solarAnnualCost

    data.push({
      year: startYear + i,
      yearIndex: i + 1,
      gridAnnual: Math.round(gridAnnual),
      gridCumulative: Math.round(gridCumulative),
      solarCumulative: Math.round(solarCumulative),
      netSavings: Math.round(gridCumulative - solarCumulative),
    })
  }

  const breakevenIdx = data.findIndex(d => d.netSavings >= 0)
  const breakevenYear = breakevenIdx >= 0 ? data[breakevenIdx].yearIndex : years

  return { data, breakevenYear }
}
