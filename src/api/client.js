import axios from 'axios'

const client = axios.create({
  baseURL: '/',
  withCredentials: true,
})

// Global loading overlay counter — fires loading-start/loading-end events for AppShell
// Only tracks mutating requests (POST, PUT, PATCH, DELETE) to avoid flickering on every page load
let pending = 0
const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete'])

function isMutation(config) {
  return MUTATION_METHODS.has((config.method ?? '').toLowerCase())
}

client.interceptors.request.use(config => {
  if (isMutation(config) && ++pending === 1) window.dispatchEvent(new CustomEvent('loading-start'))
  return config
})

// Broadcast subscription warning so the AppShell can show a banner
client.interceptors.response.use(
  (response) => {
    if (isMutation(response.config) && --pending <= 0) { pending = 0; window.dispatchEvent(new CustomEvent('loading-end')) }
    const warning = response.headers['x-subscription-warning']
    if (warning) {
      window.dispatchEvent(new CustomEvent('subscription-warning', { detail: warning }))
    }
    return response
  },
  (error) => {
    if (isMutation(error.config ?? {}) && --pending <= 0) { pending = 0; window.dispatchEvent(new CustomEvent('loading-end')) }
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
    if (error.response?.status === 402) {
      window.dispatchEvent(new CustomEvent('subscription-expired'))
    }
    return Promise.reject(error)
  }
)

export default client
