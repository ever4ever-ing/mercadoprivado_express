import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10_000
})

let refreshPromise: Promise<string | null> | null = null

async function getFreshAccessToken(): Promise<string | null> {
  const storedRefresh = localStorage.getItem('refreshToken')
  if (!storedRefresh) return null

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data: next } = await axios.post<{ accessToken: string; refreshToken: string }>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken: storedRefresh }
        )
        localStorage.setItem('token', next.accessToken)
        localStorage.setItem('refreshToken', next.refreshToken)
        return next.accessToken
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('authUser')
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      const newToken = await getFreshAccessToken()
      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      }
    }

    return Promise.reject(error)
  }
)

export default api
