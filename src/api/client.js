import axios from 'axios'

const client = axios.create({
  baseURL: '/',
  withCredentials: true,
})

// Broadcast subscription warning so the AppShell can show a banner
client.interceptors.response.use(
  (response) => {
    const warning = response.headers['x-subscription-warning']
    if (warning) {
      window.dispatchEvent(new CustomEvent('subscription-warning', { detail: warning }))
    }
    return response
  },
  (error) => {
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
