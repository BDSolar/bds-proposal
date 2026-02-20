// Encode/decode proposal state to/from URL hash
// Uses base64-encoded JSON of minimal customer + rep data
// Engine results are recomputed on restore

const HASH_PREFIX = 'p='

export function encodeProposalToHash(state) {
  const minimal = {
    c: state.customer,
    r: state.rep,
    d: state.proposal,
  }
  const json = JSON.stringify(minimal)
  const encoded = btoa(unescape(encodeURIComponent(json)))
  return `#${HASH_PREFIX}${encoded}`
}

export function decodeProposalFromHash(hash) {
  if (!hash || !hash.includes(HASH_PREFIX)) return null
  try {
    const encoded = hash.split(HASH_PREFIX)[1]
    const json = decodeURIComponent(escape(atob(encoded)))
    const parsed = JSON.parse(json)
    if (!parsed.c || !parsed.c.dailyUsage) return null
    return {
      customer: parsed.c,
      rep: parsed.r || { name: '' },
      proposal: parsed.d || { date: new Date().toISOString().split('T')[0] },
    }
  } catch {
    return null
  }
}

export function getShareUrl(state) {
  const base = window.location.origin + window.location.pathname
  return base + encodeProposalToHash(state)
}
