/** Preset event titles (short labels) and default categories. */
export const EVENT_TITLE_OPTIONS = [
  { title: 'Key handover', category: 'keys' },
  { title: 'Home inspection', category: 'inspection' },
  { title: 'Pest inspection', category: 'inspection' },
  { title: 'Well inspection', category: 'inspection' },
  { title: 'Septic inspection', category: 'inspection' },
  { title: 'Sewer inspection', category: 'inspection' },
  { title: 'Cleaning', category: 'general' },
  { title: 'Windows', category: 'general' },
  { title: 'Staging', category: 'staging' },
  { title: 'Photography', category: 'photo' },
  { title: 'Listing live', category: 'listing' },
  { title: 'Public open house', category: 'general' },
  { title: 'Broker open house', category: 'general' },
  { title: 'Seller disclosures due', category: 'general' },
]

export function categoryForTitle(title) {
  const match = EVENT_TITLE_OPTIONS.find((o) => o.title === title)
  return match?.category || 'general'
}

export function normalizeEventTitle(title) {
  const t = (title || '').trim()
  if (!t) return ''
  const exact = EVENT_TITLE_OPTIONS.find((o) => o.title.toLowerCase() === t.toLowerCase())
  if (exact) return exact.title
  const partial = EVENT_TITLE_OPTIONS.find((o) => t.toLowerCase().includes(o.title.toLowerCase()))
  return partial?.title || t
}
