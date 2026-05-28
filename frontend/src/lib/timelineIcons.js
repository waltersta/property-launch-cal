import { Calendar, Camera, Home, Key, Megaphone, Sofa } from 'lucide-react'

const CAT_ICON = {
  keys: Key,
  inspection: Home,
  staging: Sofa,
  photo: Camera,
  listing: Megaphone,
  general: Calendar,
}

/** Icon for a timeline row — open houses use a house, not the generic calendar. */
export function timelineIconForEvent(event) {
  const title = (event?.title || '').toLowerCase()
  if (/open house/i.test(title)) return Home
  return CAT_ICON[event?.category] || Calendar
}
