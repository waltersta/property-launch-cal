import { agentDisplayName, clientDisplayNames } from '@/lib/listingParties'
import { isTwoPartyKeyEvent } from '@/lib/scheduleUtils'

/** All selectable party names for an event (agent + clients). */
export function partyChoices(listingParties) {
  const agent = agentDisplayName(listingParties)
  const clients = clientDisplayNames(listingParties)
  const names = [agent, ...clients.filter((n) => n !== agent)]
  return [...new Set(names)]
}

export function defaultPartiesForEvent(event, listingParties) {
  if (event?.required_parties?.length) return [...event.required_parties]
  if (isTwoPartyKeyEvent(event) || event?.category === 'keys') {
    return partyChoices(listingParties)
  }
  return [agentDisplayName(listingParties)]
}
