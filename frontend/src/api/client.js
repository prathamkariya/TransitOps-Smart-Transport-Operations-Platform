import axios from 'axios'

/**
 * Axios instance — all requests go through /api/v1 (Vite proxies to backend:8000).
 * JWT bearer token is injected automatically via the request interceptor.
 * 401 responses clear auth and redirect to login.
 */
const client = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor — attach JWT ──────────────────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('transitops-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor — handle 401 ─────────────────────────────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('transitops-token')
      localStorage.removeItem('transitops-user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default client
