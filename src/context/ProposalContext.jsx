import { createContext, useContext, useReducer, useEffect } from 'react'
import { calculateProposal } from '../engine/calculateProposal'
import { decodeProposalFromHash } from '../utils/proposalUrl'

const STORAGE_KEY = 'bds-proposal-session'

const initialState = {
  customer: {
    firstName: '',
    lastName: '',
    address: '',
    suburb: '',
    state: 'QLD',
    postcode: '',
    email: '',
    phone: '',
    propertyType: 'House',
    householdSize: '4',
    dailyUsage: '',
    quarterlyBill: '',
    annualBill: '',
    tariffRate: '',
    supplyCharge: '',
    fitRate: '',
    roofOrientation: 'North',
    phase: 'Single',
    storeys: '1',
    hasEV: false,
    hasPool: false,
    hasAC: false,
    hasHotWater: false,
    notes: '',
  },
  rep: { name: '' },
  proposal: { date: new Date().toISOString().split('T')[0] },
  currentStep: 0,
  formSubmitted: false,
  engineResults: null,
}

function loadFromUrl() {
  try {
    const shared = decodeProposalFromHash(window.location.hash)
    if (!shared) return null
    // Clear hash to avoid re-loading on refresh
    history.replaceState(null, '', window.location.pathname + window.location.search)
    const qb = parseFloat(shared.customer.quarterlyBill) || 0
    const customer = { ...shared.customer, annualBill: (qb * 4).toFixed(0) }
    const results = calculateProposal({ customer, rep: shared.rep, proposal: shared.proposal })
    return {
      customer,
      rep: shared.rep,
      proposal: shared.proposal,
      currentStep: 1,
      formSubmitted: true,
      engineResults: results,
    }
  } catch {
    return null
  }
}

function loadFromStorage() {
  // URL hash takes priority over sessionStorage
  const fromUrl = loadFromUrl()
  if (fromUrl) return fromUrl

  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    // Re-run engine if form was submitted (functions aren't serialisable)
    if (parsed.formSubmitted && parsed.customer) {
      const results = calculateProposal({
        customer: parsed.customer,
        rep: parsed.rep,
        proposal: parsed.proposal,
      })
      return { ...parsed, engineResults: results }
    }
    return { ...parsed, engineResults: null }
  } catch {
    return null
  }
}

function saveToStorage(state) {
  try {
    // Store everything except engineResults (recomputed on restore)
    const toStore = { ...state, engineResults: null }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch { /* quota exceeded — silently ignore */ }
}

function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_CUSTOMER':
      return { ...state, customer: { ...state.customer, ...action.payload } }
    case 'UPDATE_REP':
      return { ...state, rep: { ...state.rep, ...action.payload } }
    case 'UPDATE_PROPOSAL':
      return { ...state, proposal: { ...state.proposal, ...action.payload } }
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    case 'SUBMIT_FORM': {
      const qb = parseFloat(state.customer.quarterlyBill) || 0
      const updatedCustomer = {
        ...state.customer,
        annualBill: (qb * 4).toFixed(0),
      }
      // Run the calculation engine
      const results = calculateProposal({
        customer: updatedCustomer,
        rep: state.rep,
        proposal: state.proposal,
      })
      return {
        ...state,
        formSubmitted: true,
        customer: updatedCustomer,
        engineResults: results,
        currentStep: 1,
      }
    }
    case 'INLINE_RECALCULATE': {
      const merged = { ...state.customer, ...action.payload }
      const qb2 = parseFloat(merged.quarterlyBill) || 0
      const recalcCustomer = { ...merged, annualBill: (qb2 * 4).toFixed(0) }
      const recalcResults = calculateProposal({
        customer: recalcCustomer,
        rep: state.rep,
        proposal: state.proposal,
      })
      return { ...state, customer: recalcCustomer, engineResults: recalcResults }
    }
    case 'EDIT_FORM':
      return { ...state, formSubmitted: false, currentStep: 0, engineResults: null }
    case 'RESET':
      sessionStorage.removeItem(STORAGE_KEY)
      return initialState
    default:
      return state
  }
}

const ProposalContext = createContext(null)

export function ProposalProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => loadFromStorage() || initialState)

  useEffect(() => {
    saveToStorage(state)
  }, [state])

  return (
    <ProposalContext.Provider value={{ state, dispatch }}>
      {children}
    </ProposalContext.Provider>
  )
}

export function useProposal() {
  const context = useContext(ProposalContext)
  if (!context) throw new Error('useProposal must be used within ProposalProvider')
  return context
}
