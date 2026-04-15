import api from './api'

export interface AdminProvider {
  id: string
  businessName: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  score: number
  badge: string | null
  createdAt: string
  user: { email: string; name: string; phone?: string }
  _count: { reviews: number; inquiries: number }
}

export interface AdminStats {
  providers: { total: number; active: number; pending: number; suspended: number }
  inquiries: { total: number; lastMonth: number }
  reviews:   { total: number; lastMonth: number }
  users:     { empresas: number; proveedores: number; inactive: number }
}

export interface AdminUser {
  id:        string
  email:     string
  name:      string
  role:      'EMPRESA' | 'PROVEEDOR'
  phone?:    string
  active:    boolean
  createdAt: string
  provider?: { id: string; businessName: string; status: string } | null
}

export async function getStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>('/admin/stats')
  return data
}

export async function listAdminProviders(
  page = 1,
  status?: string
): Promise<{ data: AdminProvider[]; total: number }> {
  const params: Record<string, unknown> = { page, limit: 20 }
  if (status) params.status = status
  const { data } = await api.get('/admin/providers', { params })
  return data
}

export async function updateProviderStatus(id: string, status: string): Promise<void> {
  await api.patch(`/admin/providers/${id}/status`, { status })
}

export async function deleteReview(id: string): Promise<void> {
  await api.delete(`/admin/reviews/${id}`)
}

export async function listAdminUsers(
  page = 1,
  role?: string,
  search?: string
): Promise<{ data: AdminUser[]; total: number }> {
  const params: Record<string, unknown> = { page, limit: 20 }
  if (role)   params.role   = role
  if (search) params.search = search
  const { data } = await api.get('/admin/users', { params })
  return data
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  await api.patch(`/admin/users/${id}/active`, { active })
}

export async function deleteAdminUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${id}`)
}
