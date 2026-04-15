export type Badge = 'GOLD' | 'SILVER' | 'BRONZE' | null

export type Category =
  | 'PINTURA'
  | 'SOLDADURA'
  | 'ELECTRICO'
  | 'MANTENIMIENTO'
  | 'LIMPIEZA'
  | 'GASFITERIA'
  | 'CLIMATIZACION'
  | 'CONSTRUCCION'
  | 'OTRO'

export type Status = 'PENDING' | 'ACTIVE' | 'SUSPENDED'
export type Role = 'EMPRESA' | 'PROVEEDOR' | 'ADMIN'

export interface ProviderService {
  id: string
  category: Category
  title?: string
  description?: string
  priceFrom?: number
  priceTo?: number
}

export interface Provider {
  id: string
  name: string
  description?: string
  region: string
  phone?: string | null
  score: number
  badge: Badge
  verified: boolean
  status: Status
  services: ProviderService[]
  reviewCount: number
  createdAt: string
}

export interface ProviderReview {
  id: string
  rating: number
  comment?: string
  verified: boolean
  providerReply?: string | null
  repliedAt?: string | null
  createdAt: string
  author?: {
    name: string
  }
}

export interface ReviewsResponse {
  data: ProviderReview[]
  total: number
  page: number
  limit: number
}

export interface ProviderPortfolioImage {
  id: string
  url: string
  caption?: string
  order?: number
}

export interface ProviderDetail extends Provider {
  businessName?: string
  website?: string | null
  city?: string | null
  address?: string | null
  profileComplete?: boolean
  portfolio?: ProviderPortfolioImage[]
  reviews?: ProviderReview[]
}

export interface ProvidersResponse {
  data: Provider[]
  total: number
  page: number
  limit: number
}

export interface ProviderFilters {
  search: string
  category: Category | ''
  region: string
  minScore: number
  orderBy: 'score' | 'createdAt' | 'name'
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  providerId?: string | null
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  name: string
  phone?: string
  role: 'EMPRESA' | 'PROVEEDOR'
}

export interface ProviderServicePayload {
  category: Category
  title: string
  description?: string
  priceFrom?: number
  priceTo?: number
}

export interface ProviderUpsertPayload {
  businessName: string
  description?: string
  region: string
  city?: string
  address?: string
  website?: string
  status?: Status
  services: ProviderServicePayload[]
}
