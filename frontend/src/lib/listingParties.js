export const MAX_CLIENTS = 4

export const DEFAULT_LISTING_PARTIES = {
  agent: { name: 'Walter', email: '', color: '#e0e7ff' },
  clients: [{ name: 'Client', email: '', color: '#fef3c7' }],
}

/** First token of a full name — used for agent display everywhere. */
export function firstNameOnly(name) {
  const t = String(name || '').trim()
  if (!t) return ''
  return t.split(/\s+/)[0]
}

const CLIENT_COLORS = ['#fef3c7', '#fce7f3', '#d1fae5', '#e0f2fe']

export function normalizeListingParties(raw) {
  if (!raw || typeof raw !== 'object') {
    return structuredClone(DEFAULT_LISTING_PARTIES)
  }
  const agent = raw.agent && typeof raw.agent === 'object' ? raw.agent : {}
  const clientsIn = Array.isArray(raw.clients) ? raw.clients : []
  const clients = []
  for (const item of clientsIn) {
    if (!item || typeof item !== 'object') continue
    const name = String(item.name || '').trim()
    if (!name) continue
    clients.push({
      name,
      email: String(item.email || '').trim(),
      color: String(item.color || '').trim() || CLIENT_COLORS[clients.length % CLIENT_COLORS.length],
    })
    if (clients.length >= MAX_CLIENTS) break
  }
  const agentRaw = String(agent.name || DEFAULT_LISTING_PARTIES.agent.name).trim()
  return {
    agent: {
      name: firstNameOnly(agentRaw) || DEFAULT_LISTING_PARTIES.agent.name,
      email: String(agent.email || '').trim(),
      color: String(agent.color || DEFAULT_LISTING_PARTIES.agent.color).trim() || DEFAULT_LISTING_PARTIES.agent.color,
    },
    clients: clients.length ? clients : structuredClone(DEFAULT_LISTING_PARTIES.clients),
  }
}

/** Four editable rows (blank slots allowed in the form). */
export function clientFormRows(parties) {
  const filled = [...(parties?.clients || [])]
  while (filled.length < MAX_CLIENTS) {
    filled.push({
      name: '',
      email: '',
      color: CLIENT_COLORS[filled.length % CLIENT_COLORS.length],
    })
  }
  return filled.slice(0, MAX_CLIENTS)
}

export function partiesForSave(agent, clientRows) {
  const clients = clientRows
    .map((row) => ({
      name: String(row.name || '').trim(),
      email: String(row.email || '').trim(),
      color: String(row.color || '').trim(),
    }))
    .filter((row) => row.name)
  return {
    agent: {
      name: firstNameOnly(String(agent.name || '').trim()) || DEFAULT_LISTING_PARTIES.agent.name,
      email: String(agent.email || '').trim(),
      color: String(agent.color || '').trim() || DEFAULT_LISTING_PARTIES.agent.color,
    },
    clients: clients.length ? clients : DEFAULT_LISTING_PARTIES.clients,
  }
}

export function agentDisplayName(parties) {
  const raw = parties?.agent?.name?.trim() || DEFAULT_LISTING_PARTIES.agent.name
  return firstNameOnly(raw) || DEFAULT_LISTING_PARTIES.agent.name
}

export function clientDisplayNames(parties) {
  const names = (parties?.clients || []).map((c) => c.name?.trim()).filter(Boolean)
  return names.length ? names : [DEFAULT_LISTING_PARTIES.clients[0].name]
}

export function clientNamesLabel(parties) {
  const names = clientDisplayNames(parties)
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}
