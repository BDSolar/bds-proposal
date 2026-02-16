// Hour-by-hour battery charge/discharge simulation
export function simulateBattery(totalLoad, solarRaw, config = {}) {
  const capacity = config.capacity || 30
  const maxCharge = config.maxCharge || 10
  const maxDischarge = config.maxDischarge || 10
  const efficiency = config.efficiency || 0.95
  const initialSoc = config.initialSoc ?? 2

  const battSOC = []
  const battCharge = []
  const battDischarge = []
  const gridImport = []
  const gridExport = []
  const selfConsume = []

  let soc = initialSoc

  for (let h = 0; h < 24; h++) {
    const load = totalLoad[h]
    const solar = solarRaw[h]
    const netSolar = solar - load

    let charge = 0
    let discharge = 0
    let gi = 0
    let ge = 0
    const sc = Math.min(load, solar)

    if (netSolar > 0) {
      const canCharge = Math.min(netSolar, maxCharge, (capacity - soc) / efficiency)
      charge = Math.max(0, canCharge)
      soc += charge * efficiency
      soc = Math.min(soc, capacity)
      ge = netSolar - charge
    } else {
      const deficit = -netSolar
      const canDischarge = Math.min(deficit, maxDischarge, soc)
      discharge = Math.max(0, canDischarge)
      soc -= discharge
      soc = Math.max(0, soc)
      gi = deficit - discharge
    }

    battSOC.push(Math.round(soc * 10) / 10)
    battCharge.push(Math.round(charge * 10) / 10)
    battDischarge.push(Math.round(discharge * 10) / 10)
    gridImport.push(Math.round(gi * 10) / 10)
    gridExport.push(Math.round(ge * 10) / 10)
    selfConsume.push(Math.round(sc * 10) / 10)
  }

  const totalGridImport = gridImport.reduce((a, b) => a + b, 0)
  const totalSelfConsume = selfConsume.reduce((a, b) => a + b, 0)
  const totalBattDischarge = battDischarge.reduce((a, b) => a + b, 0)
  const totalUsage = totalLoad.reduce((a, b) => a + b, 0)
  const selfPoweredPct = Math.round(((totalSelfConsume + totalBattDischarge) / totalUsage) * 100)

  return {
    battSOC,
    battCharge,
    battDischarge,
    gridImport,
    gridExport,
    selfConsume,
    totalGridImport,
    totalSelfConsume,
    totalBattDischarge,
    selfPoweredPct,
  }
}
