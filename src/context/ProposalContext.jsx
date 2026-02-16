import { createContext, useContext, useReducer } from 'react'
import { calculateProposal } from '../engine/calculateProposal'

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
    case 'EDIT_FORM':
      return { ...state, formSubmitted: false, currentStep: 0, engineResults: null }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

const ProposalContext = createContext(null)

export function ProposalProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
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
