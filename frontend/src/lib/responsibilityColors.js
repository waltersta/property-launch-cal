import { AGENT_NAME, isTwoPartyKeyEvent } from '@/lib/scheduleUtils'

/** Distinct colors per responsible person (print-friendly). */
export const CLIENT_LABEL = 'Client'

/** Calendar/legend label for whoever picks a date (not vendor assignees). */
export function displayPickOwner(owner) {
  if (!owner || /^matt$/i.test(owner.trim())) return CLIENT_LABEL
  return owner.trim()
}

const PERSON_PALETTE = {
  'Walter Stauss': { bg: '#e0e7ff', text: '#312e81', label: 'Walter Stauss' },
  [CLIENT_LABEL]: { bg: '#fef3c7', text: '#92400e', label: CLIENT_LABEL },
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

export function getPersonColor(name) {
  if (!name) return FALLBACK_COLORS[0]
  if (PERSON_PALETTE[name]) return { ...PERSON_PALETTE[name], label: name }
  const idx = hashName(name) % FALLBACK_COLORS.length
  return { ...FALLBACK_COLORS[idx], label: name }
}

/** Who must participate — agent on site for all milestones; client only on key handover. */
export function getResponsibleParties(event) {
  if (isTwoPartyKeyEvent(event)) {
    return [AGENT_NAME, CLIENT_LABEL]
  }
  return [AGENT_NAME]
}

export function collectPartiesFromEvents(events) {
  const set = new Set()
  for (const e of events) {
    for (const p of getResponsibleParties(e)) set.add(p)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function getEventChipPresentation(event) {
  const parties = getResponsibleParties(event)
  const awaiting = event.status === 'awaiting_pick'

  if (parties.length === 1) {
    const c = getPersonColor(parties[0])
    return {
      style: { background: c.bg, color: c.text },
      parties,
      awaiting,
    }
  }

  const [a, b] = parties
  const c1 = getPersonColor(a)
  const c2 = getPersonColor(b)
  return {
    style: {
      background: `linear-gradient(to right, ${c1.bg} 50%, ${c2.bg} 50%)`,
      color: '#18181b',
    },
    parties,
    awaiting,
  }
}
