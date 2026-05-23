import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
export const API = `${BACKEND_URL}/api`
export const ADMIN_KEY = 'rd_admin_token'

function adminHeaders() {
  const t = localStorage.getItem(ADMIN_KEY)
  return t ? { 'X-Admin-Token': t } : {}
}

const api = {
  getConfig: () => axios.get(`${API}/config`).then((r) => r.data),
  updateConfig: (data) =>
    axios.put(`${API}/config`, data, { headers: adminHeaders() }).then((r) => r.data),
  list: () => axios.get(`${API}/events`).then((r) => r.data),
  create: (data) =>
    axios.post(`${API}/events`, data, { headers: adminHeaders() }).then((r) => r.data),
  update: (id, data) =>
    axios.put(`${API}/events/${id}`, data, { headers: adminHeaders() }).then((r) => r.data),
  remove: (id) =>
    axios.delete(`${API}/events/${id}`, { headers: adminHeaders() }).then((r) => r.data),
  pick: (id, data) =>
    axios.post(`${API}/events/${id}/pick`, data).then((r) => r.data),
  reset: () =>
    axios.post(`${API}/events/reset`, {}, { headers: adminHeaders() }).then((r) => r.data),
  generatePickToken: (id) =>
    axios
      .post(`${API}/events/${id}/pick-token`, {}, { headers: adminHeaders() })
      .then((r) => r.data),
  listViews: (id) =>
    axios.get(`${API}/events/${id}/views`, { headers: adminHeaders() }).then((r) => r.data),
  verifyAdmin: (token) =>
    axios.post(`${API}/admin/verify`, { token }).then((r) => r.data),
  shareGet: (token) => axios.get(`${API}/share/pick/${token}`).then((r) => r.data),
  sharePick: (token, data) =>
    axios.post(`${API}/share/pick/${token}/submit`, data).then((r) => r.data),
  getClientLinks: () =>
    axios.get(`${API}/share/links`, { headers: adminHeaders() }).then((r) => r.data),
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
}

export const CATEGORIES = [
  { value: 'keys', label: 'Keys' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'staging', label: 'Staging' },
  { value: 'photo', label: 'Photography' },
  { value: 'listing', label: 'Listing' },
  { value: 'general', label: 'General' },
]

export function effectiveSortDate(e) {
  if (e.status === 'awaiting_pick') {
    const opts = e.date_options || []
    return opts.length ? opts.sort()[0] : '9999-12-31'
  }
  return e.date || '9999-12-31'
}

export default api
