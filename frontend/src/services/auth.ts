import api from './api'
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/types'

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  return data
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload)
  return data
}

export async function refresh(refreshToken: string): Promise<Pick<AuthResponse, 'accessToken' | 'refreshToken'>> {
  const { data } = await api.post<Pick<AuthResponse, 'accessToken' | 'refreshToken'>>('/auth/refresh', {
    refreshToken
  })
  return data
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken })
}
