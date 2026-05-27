import { AGENT_NAME, isTwoPartyKeyEvent } from '@/lib/scheduleUtils'
import {
  agentDisplayName,
  clientDisplayNames,
  DEFAULT_LISTING_PARTIES,
  firstNameOnly,
} from '@/lib/listingParties'

/** @deprecated use clientDisplayNames */
export const CLIENT_LABEL = 'Client'

function textOnBg(hex) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#18181b'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.62 ? '#18181b' : '#fafafa'
}

const FALLBACK_COLORS = [
  { bg: '#f4f4f5', text: '#3f3f46', label: '' },
  { bg: '#fce7f3', text: '#9d174d', label: '' },
]

function hashName(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return Math.abs(h)
}

function namesMatch(a, b) {
  if (!a || !b) return false
  if (a === b) return true
  return firstNameOnly(a) === firstNameOnly(b)
}

function partyColorFromConfig(name, listingParties) {
  const parties = listingParties || DEFAULT_LISTING_PARTIES
  const agentName = agentDisplayName(parties)
  if (namesMatch(name, agentName) && parties.agent?.color) {
    const bg = parties.agent.color
    return { bg, text: textOnBg(bg), label: name }
  }
  for (const c of parties.clients || []) {
    if (c.name === name && c.color) {
      const bg = c.color
      return { bg, text: textOnBg(bg), label: name }
    }
  }
  return null
}

export function getPersonColor(name, listingParties) {
  if (!name) return FALLBACK_COLORS[0]
  const configured = partyColorFromConfig(name, listingParties)
  if (configured) return configured
  const idx = hashName(name) % FALLBACK_COLORS.length
  return { ...FALLBACK_COLORS[idx], label: name }
}

/** Calendar/legend label for whoever picks a date (not vendor assignees). */
export function displayPickOwner(owner, listingParties) {
  if (!owner || /^matt$/i.test(owner.trim())) {
    return clientDisplayNames(listingParties)[0] || CLIENT_LABEL
  }
  return owner.trim()
}

/** Who must participate — uses event.required_parties when set, else legacy rules. */
export function getResponsibleParties(event, listingParties) {
  const configured = (event?.required_parties || []).filter(Boolean)
  if (configured.length) return configured
  const parties = listingParties || DEFAULT_LISTING_PARTIES
  const agent = agentDisplayName(parties)
  if (isTwoPartyKeyEvent(event)) {
    const clients = clientDisplayNames(parties)
    return [agent, ...clients]
  }
  return [agent]
}

export function collectPartiesFromEvents(events, listingParties) {
  const set = new Set()
  for (const e of events) {
    for (const p of getResponsibleParties(e, listingParties)) set.add(p)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

function gradientForParties(parties, listingParties) {
  if (parties.length === 1) {
    const c = getPersonColor(parties[0], listingParties)
    return { background: c.bg, color: c.text }
  }
  const slice = 100 / parties.length
  const stops = parties
    .map((name, i) => {
      const c = getPersonColor(name, listingParties)
      const start = (slice * i).toFixed(2)
      const end = (slice * (i + 1)).toFixed(2)
      return `${c.bg} ${start}%, ${c.bg} ${end}%`
    })
    .join(', ')
  return {
    background: `linear-gradient(to right, ${stops})`,
    color: '#18181b',
  }
}

export function getEventChipPresentation(event, listingParties) {
  const parties = getResponsibleParties(event, listingParties)
  const awaiting = event.status === 'awaiting_pick'
  const gradient = gradientForParties(parties, listingParties)
  return {
    style: gradient,
    parties,
    awaiting,
  }
}
