// Quote Builder — Supabase Persistence
// Save, load, and search quotes

import { supabase } from '../lib/supabase'

/**
 * Save quote to Supabase
 * @param {object} state — full quote state
 * @param {object} pricing — computed pricing from engine
 * @returns {{ id, error }}
 */
export async function saveQuote(state, pricing) {
  // Build customer with normalized 'name' key for generated search columns
  const customer = { ...state.customer }
  if (!customer.name && (customer.firstName || customer.lastName)) {
    customer.name = [customer.firstName, customer.lastName].filter(Boolean).join(' ')
  }

  const row = {
    customer,
    system: {
      systemType: state.systemType || 'hybrid',
      manufacturer: state.manufacturer,
      batteryTypeIdx: state.batteryTypeIdx,
      phase: state.phase,
      panelIdx: state.panelIdx,
      panelCount: state.panelCount,
      desiredBatteryKwh: state.desiredBatteryKwh,
      inverterSku: state.inverterSku,
      userChangedInverter: state.userChangedInverter,
      gatewaySku: state.gatewaySku,
      dualStackEcOverride: state.dualStackEcOverride,
      selectedAccessories: state.selectedAccessories,
    },
    mounting: {
      roofType: state.roofType,
      orientation: state.orientation,
      numRows: state.numRows,
      numArrays: state.numArrays,
      tiltAngle: state.tiltAngle,
      mountingType: state.mountingType,
    },
    pricing: {
      gpMargin: state.gpMargin,
      salesCommission: state.salesCommission,
      stcPrice: state.stcPrice,
      deemingPeriod: state.deemingPeriod,
      batteryRebatePerKwh: state.batteryRebatePerKwh,
      installPvPerKw: state.installPvPerKw,
      installBatPerStack: state.installBatPerStack,
    },
    custom_addons: state.customAddons || [],
    totals: pricing ? {
      customerPrice: pricing.customerPrice,
      sysKw: pricing.sysKw,
      batteryKwh: pricing.batteryKwh,
    } : null,
  }

  // Upsert: update if quoteId exists, insert if new
  if (state.quoteId) {
    const { error } = await supabase
      .from('quotes')
      .update(row)
      .eq('id', state.quoteId)
    return { id: state.quoteId, error }
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert(row)
    .select('id')
    .single()
  return { id: data?.id || null, error }
}

/**
 * Load quote by ID from Supabase
 * @param {string} quoteId
 * @returns {{ state, error }}
 */
export async function loadQuote(quoteId) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single()

  if (error || !data) return { state: null, error: error || new Error('Not found') }

  const loaded = {
    customer: data.customer,
    ...data.system,
    ...data.mounting,
    ...data.pricing,
    customAddons: data.custom_addons || [],
    quoteId: data.id,
  }

  return { state: loaded, error: null }
}

/**
 * Search quotes by name, phone, suburb, or postcode
 * @param {string} query
 * @returns {{ results, error }}
 */
export async function searchQuotes(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return { results: [], error: null }

  // Try numeric → postcode/phone, otherwise name/suburb
  const isNumeric = /^\d+$/.test(q)

  let builder = supabase
    .from('quotes')
    .select('id, customer, totals, updated_at')
    .order('updated_at', { ascending: false })
    .limit(20)

  if (isNumeric) {
    if (q.length === 4) {
      builder = builder.eq('search_postcode', q)
    } else {
      builder = builder.ilike('search_phone', `%${q}%`)
    }
  } else {
    builder = builder.or(`search_name.ilike.%${q}%,search_suburb.ilike.%${q}%`)
  }

  const { data, error } = await builder
  return { results: data || [], error }
}
