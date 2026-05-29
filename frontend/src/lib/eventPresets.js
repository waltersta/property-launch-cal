/** Default New Event dropdown sources (used when config has no custom lists). */
export const DEFAULT_EVENT_PRESETS = [
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
  { title: 'COE', category: 'deadline' },
  { title: 'Close of escrow', category: 'deadline' },
]

export const DEFAULT_CATEGORY_PRESETS = [
  { value: 'keys', label: 'Keys' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'staging', label: 'Staging' },
  { value: 'photo', label: 'Photography' },
  { value: 'listing', label: 'Listing' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'showing', label: 'Showing' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'general', label: 'General' },
]

export function eventPresetsFromConfig(config) {
  const rows = config?.event_presets
  if (Array.isArray(rows) && rows.length) {
    return rows.map((r) => ({
      title: String(r.title || '').trim(),
      category: String(r.category || 'general').trim() || 'general',
    })).filter((r) => r.title)
  }
  return DEFAULT_EVENT_PRESETS
}

export function categoryPresetsFromConfig(config) {
  const rows = config?.category_presets
  if (Array.isArray(rows) && rows.length) {
    return rows.map((r) => ({
      value: String(r.value || '').trim(),
      label: String(r.label || r.value || '').trim() || String(r.value || '').trim(),
    })).filter((r) => r.value)
  }
  return DEFAULT_CATEGORY_PRESETS
}
