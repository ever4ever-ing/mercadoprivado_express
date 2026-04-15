import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthUser, LoginPayload, RegisterPayload } from '@/types'
import * as authService from '@/services/auth'

const ACCESS_TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'authUser'

function readUserFromStorage(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY))
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY))
  const user = ref<AuthUser | null>(readUserFromStorage())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  function setSession(nextToken: string, nextRefresh: string, nextUser: AuthUser) {
    token.value = nextToken
    refreshToken.value = nextRefresh
    user.value = nextUser

    localStorage.setItem(ACCESS_TOKEN_KEY, nextToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, nextRefresh)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }

  function clearSession() {
    token.value = null
    refreshToken.value = null
    user.value = null

    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    error.value = null
    try {
      const data = await authService.login(payload)
      setSession(data.accessToken, data.refreshToken, data.user)
    } catch (e) {
      error.value = 'No fue posible iniciar sesión con esas credenciales.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    error.value = null
    try {
      const data = await authService.register(payload)
      setSession(data.accessToken, data.refreshToken, data.user)
    } catch (e) {
      error.value = 'No fue posible completar el registro.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    const currentRefresh = refreshToken.value
    if (currentRefresh) {
      try {
        await authService.logout(currentRefresh)
      } catch {
        // Limpiamos sesión local aunque el backend no responda
      }
    }
    clearSession()
  }

  return {
    token,
    refreshToken,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    setSession,
    clearSession
  }
})
