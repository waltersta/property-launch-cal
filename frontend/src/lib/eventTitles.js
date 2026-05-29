import { DEFAULT_EVENT_PRESETS, eventPresetsFromConfig } from '@/lib/eventPresets'

/** @deprecated use eventPresetsFromConfig — kept for imports */
export const EVENT_TITLE_OPTIONS = DEFAULT_EVENT_PRESETS

export function eventTitleOptions(config) {
  return eventPresetsFromConfig(config)
}

export function categoryForTitle(title, titleOptions = DEFAULT_EVENT_PRESETS) {
  const match = titleOptions.find((o) => o.title === title)
  return match?.category || 'general'
}

export function normalizeEventTitle(title, titleOptions = DEFAULT_EVENT_PRESETS) {
  const t = (title || '').trim()
  if (!t) return ''
  const exact = titleOptions.find((o) => o.title.toLowerCase() === t.toLowerCase())
  if (exact) return exact.title
  const partial = titleOptions.find((o) => t.toLowerCase().includes(o.title.toLowerCase()))
  return partial?.title || t
}
