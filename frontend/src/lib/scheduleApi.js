import axios from 'axios'
import { DEFAULT_CATEGORY_PRESETS } from '@/lib/eventPresets'
import { clientHeaders } from '@/lib/clientAuth'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
export const API = `${BACKEND_URL}/api`
export const ADMIN_KEY = 'rd_admin_token'

function adminHeaders() {
  const t = localStorage.getItem(ADMIN_KEY)
  return t ? { 'X-Admin-Token': t } : {}
}

function listingParams(propertySlug) {
  return propertySlug ? { property: propertySlug } : {}
}

function accessHeaders(propertySlug) {
  return { ...clientHeaders(propertySlug), ...adminHeaders() }
}

const api = {
  getConfig: (propertySlug) =>
    axios.get(`${API}/config`, { params: listingParams(propertySlug) }).then((r) => r.data),

  updateConfig: (propertySlug, data) =>
    axios
      .put(`${API}/config`, data, {
        params: listingParams(propertySlug),
        headers: adminHeaders(),
      })
      .then((r) => r.data),

  list: (propertySlug) =>
    axios
      .get(`${API}/events`, {
        params: listingParams(propertySlug),
        headers: accessHeaders(propertySlug),
      })
      .then((r) => r.data),

  create: (propertySlug, data) =>
    axios
      .post(`${API}/events`, data, {
        params: listingParams(propertySlug),
        headers: adminHeaders(),
      })
      .then((r) => r.data),

  update: (id, data) =>
    axios.put(`${API}/events/${id}`, data, { headers: adminHeaders() }).then((r) => r.data),

  remove: (id) =>
    axios.delete(`${API}/events/${id}`, { headers: adminHeaders() }).then((r) => r.data),

  pick: (id, data) => axios.post(`${API}/events/${id}/pick`, data).then((r) => r.data),

  reset: (propertySlug) =>
    axios
      .post(`${API}/events/reset`, {}, {
        params: listingParams(propertySlug),
        headers: adminHeaders(),
      })
      .then((r) => r.data),

  generatePickToken: (id) =>
    axios
      .post(`${API}/events/${id}/pick-token`, {}, { headers: adminHeaders() })
      .then((r) => r.data),

  listViews: (id) =>
    axios.get(`${API}/events/${id}/views`, { headers: adminHeaders() }).then((r) => r.data),

  verifyAdmin: (token) => axios.post(`${API}/admin/verify`, { token }).then((r) => r.data),

  verifyClient: (propertySlug, passcode) =>
    axios
      .post(`${API}/share/client-auth`, { property: propertySlug, passcode })
      .then((r) => r.data),

  shareGet: (token) => axios.get(`${API}/share/pick/${token}`).then((r) => r.data),

  sharePick: (token, data) =>
    axios.post(`${API}/share/pick/${token}/submit`, data).then((r) => r.data),

  getClientLinks: (propertySlug) =>
    axios
      .get(`${API}/share/links`, {
        params: listingParams(propertySlug),
        headers: adminHeaders(),
      })
      .then((r) => r.data),

  listNotes: (propertySlug) =>
    axios
      .get(`${API}/notes`, {
        params: listingParams(propertySlug),
        headers: accessHeaders(propertySlug),
      })
      .then((r) => r.data),

  createNote: (propertySlug, data) =>
    axios
      .post(`${API}/notes`, data, {
        params: listingParams(propertySlug),
        headers: adminHeaders(),
      })
      .then((r) => r.data),

  updateNote: (id, data) =>
    axios.put(`${API}/notes/${id}`, data, { headers: adminHeaders() }).then((r) => r.data),

  deleteNote: (id) =>
    axios.delete(`${API}/notes/${id}`, { headers: adminHeaders() }).then((r) => r.data),

  listProperties: () =>
    axios.get(`${API}/properties`, { headers: adminHeaders() }).then((r) => r.data),

  createProperty: (data) =>
    axios.post(`${API}/properties`, data, { headers: adminHeaders() }).then((r) => r.data),

  listNotifications: (unreadOnly = true) =>
    axios
      .get(`${API}/notifications`, {
        params: { unread_only: unreadOnly },
        headers: adminHeaders(),
      })
      .then((r) => r.data),

  unreadNotificationCount: () =>
    axios.get(`${API}/notifications/unread-count`, { headers: adminHeaders() }).then((r) => r.data),

  markNotificationRead: (id) =>
    axios.post(`${API}/notifications/${id}/read`, {}, { headers: adminHeaders() }).then((r) => r.data),

  markAllNotificationsRead: () =>
    axios.post(`${API}/notifications/read-all`, {}, { headers: adminHeaders() }).then((r) => r.data),

  getAgentMe: () => axios.get(`${API}/agents/me`, { headers: adminHeaders() }).then((r) => r.data),

  betaInvite: (data) =>
    axios.post(`${API}/agents/beta-invite`, data, { headers: adminHeaders() }).then((r) => r.data),

  claimAgentInvite: (token) => axios.post(`${API}/agents/claim`, { token }).then((r) => r.data),

  completeOnboarding: () =>
    axios.post(`${API}/agents/onboarding-complete`, {}, { headers: adminHeaders() }).then((r) => r.data),
}

export const CATEGORIES = DEFAULT_CATEGORY_PRESETS

export const NOTE_STATUSES = ['Open', 'Waiting', 'In progress', 'Done']

export function effectiveSortDate(e) {
  if (e.status === 'awaiting_pick') {
    const opts = e.date_options || []
    return opts.length ? opts.sort()[0] : '9999-12-31'
  }
  return e.date || '9999-12-31'
}

export default api
