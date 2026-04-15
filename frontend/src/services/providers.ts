import type {
  Provider,
  ProviderDetail,
  ProviderFilters,
  ProviderReview,
  ReviewsResponse,
  ProvidersResponse,
  ProviderUpsertPayload
} from '@/types'
import api from './api'

// Datos de prueba hasta que el backend esté disponible
const MOCK_PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'Pinturería Industrial Los Andes',
    description:
      'Especialistas en pintura industrial epóxica y anticorrosiva con más de 15 años de experiencia en el sector minero y construcción.',
    region: 'Metropolitana',
    score: 4.8,
    badge: 'GOLD',
    verified: true,
    status: 'ACTIVE',
    services: [
      { id: '1a', category: 'PINTURA', description: 'Pintura epóxica industrial' },
      { id: '1b', category: 'MANTENIMIENTO', description: 'Mantenimiento preventivo' }
    ],
    reviewCount: 28,
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Electro Servicios Valparaíso',
    description:
      "Instalaciones y mantención eléctrica industrial. Certificados SEC. Atendemos Valparaíso y Región de O'Higgins.",
    region: 'Valparaíso',
    score: 4.0,
    badge: 'SILVER',
    verified: true,
    status: 'ACTIVE',
    services: [{ id: '2a', category: 'ELECTRICO', description: 'Instalaciones eléctricas industriales' }],
    reviewCount: 14,
    createdAt: '2024-03-10T00:00:00Z'
  },
  {
    id: '3',
    name: 'Soldadura y Montajes Del Sur',
    description:
      'Empresa especializada en estructuras metálicas, soldadura MIG/TIG y montajes industriales en acero inoxidable y carbono.',
    region: 'Biobío',
    score: 4.6,
    badge: 'GOLD',
    verified: true,
    status: 'ACTIVE',
    services: [
      { id: '3a', category: 'SOLDADURA', description: 'Soldadura MIG/TIG industrial' },
      { id: '3b', category: 'MANTENIMIENTO', description: 'Montajes industriales' }
    ],
    reviewCount: 21,
    createdAt: '2024-02-05T00:00:00Z'
  },
  {
    id: '4',
    name: 'Mantenimiento Total Chile',
    description:
      'Servicios de mantenimiento preventivo y correctivo para plantas industriales, bodegas y centros de distribución.',
    region: 'Metropolitana',
    score: 3.2,
    badge: 'BRONZE',
    verified: false,
    status: 'ACTIVE',
    services: [{ id: '4a', category: 'MANTENIMIENTO', description: 'Mantenimiento general' }],
    reviewCount: 7,
    createdAt: '2024-05-20T00:00:00Z'
  },
  {
    id: '5',
    name: 'Limpieza Industrial Norte',
    description:
      'Servicio profesional de limpieza industrial, sanitización y manejo de residuos para minería y manufactura.',
    region: 'Antofagasta',
    score: 3.8,
    badge: 'SILVER',
    verified: true,
    status: 'ACTIVE',
    services: [{ id: '5a', category: 'LIMPIEZA', description: 'Limpieza industrial especializada' }],
    reviewCount: 11,
    createdAt: '2024-04-12T00:00:00Z'
  },
  {
    id: '6',
    name: 'Pinturas y Revestimientos SPA',
    description:
      'Aplicación de revestimientos protectores, pintura electrostática y tratamientos superficiales para equipos industriales.',
    region: 'Metropolitana',
    score: 4.7,
    badge: 'GOLD',
    verified: true,
    status: 'ACTIVE',
    services: [
      { id: '6a', category: 'PINTURA', description: 'Revestimientos protectores' },
      { id: '6b', category: 'OTRO', description: 'Tratamientos superficiales' }
    ],
    reviewCount: 33,
    createdAt: '2023-11-08T00:00:00Z'
  },
  {
    id: '7',
    name: 'Servicios Eléctricos Araucanía',
    description:
      'Mantención de tableros eléctricos, motores industriales y automatización básica. Cobertura regional.',
    region: 'Araucanía',
    score: 2.8,
    badge: 'BRONZE',
    verified: false,
    status: 'ACTIVE',
    services: [{ id: '7a', category: 'ELECTRICO', description: 'Mantención eléctrica' }],
    reviewCount: 4,
    createdAt: '2024-06-01T00:00:00Z'
  },
  {
    id: '8',
    name: 'Mantenimiento Costa Pacific',
    description:
      'Servicios de mantención para industria pesquera, acuicultura y puertos. Especialistas en ambientes corrosivos.',
    region: 'Los Lagos',
    score: 3.9,
    badge: 'SILVER',
    verified: true,
    status: 'ACTIVE',
    services: [
      { id: '8a', category: 'MANTENIMIENTO', description: 'Mantención para industria pesquera' },
      { id: '8b', category: 'SOLDADURA', description: 'Soldadura en ambiente marino' }
    ],
    reviewCount: 9,
    createdAt: '2024-03-28T00:00:00Z'
  },
  {
    id: '9',
    name: 'Soldadura Especializada SA',
    description:
      'Soldadura de alta especialización para petroquímica, minería y generación de energía. Certificados ASME.',
    region: 'Valparaíso',
    score: 4.5,
    badge: 'GOLD',
    verified: true,
    status: 'ACTIVE',
    services: [{ id: '9a', category: 'SOLDADURA', description: 'Soldadura ASME certificada' }],
    reviewCount: 18,
    createdAt: '2024-01-30T00:00:00Z'
  },
  {
    id: '10',
    name: 'Limpieza y Sanitización Chile',
    description:
      'Empresa certificada en limpieza profunda, sanitización y control de plagas para industria alimentaria y farmacéutica.',
    region: 'Metropolitana',
    score: 4.1,
    badge: 'SILVER',
    verified: true,
    status: 'ACTIVE',
    services: [{ id: '10a', category: 'LIMPIEZA', description: 'Limpieza industria alimentaria' }],
    reviewCount: 16,
    createdAt: '2024-02-20T00:00:00Z'
  },
  {
    id: '11',
    name: 'Servicios Industriales Atacama',
    description: 'Servicios generales para minería en la Región de Atacama. En proceso de certificación.',
    region: 'Atacama',
    score: 2.0,
    badge: null,
    verified: false,
    status: 'ACTIVE',
    services: [
      { id: '11a', category: 'MANTENIMIENTO', description: 'Servicios generales' },
      { id: '11b', category: 'OTRO', description: 'Servicios varios' }
    ],
    reviewCount: 2,
    createdAt: '2024-07-01T00:00:00Z'
  },
  {
    id: '12',
    name: 'Pinturas Sur Ltda.',
    description:
      'Aplicación de pinturas industriales en estructura metálica, techumbres y pisos epóxicos en la zona central-sur.',
    region: "O'Higgins",
    score: 3.0,
    badge: 'BRONZE',
    verified: false,
    status: 'ACTIVE',
    services: [{ id: '12a', category: 'PINTURA', description: 'Pintura industrial estructural' }],
    reviewCount: 5,
    createdAt: '2024-05-05T00:00:00Z'
  }
]

// Cambiar a false cuando el backend esté listo
const USE_MOCK = false

export async function getProviders(
  filters: Partial<ProviderFilters> = {},
  page = 1,
  limit = 9
): Promise<ProvidersResponse> {
  if (USE_MOCK) {
    return simulateMockProviders(filters, page, limit)
  }

  // No enviar filtros vacíos que rompen el validador Zod del backend
  const params: Record<string, unknown> = { page, limit }

  if (filters.search) params.search = filters.search
  if (filters.category) params.category = filters.category
  if (filters.region) params.region = filters.region
  if (filters.minScore && filters.minScore > 0) params.minScore = filters.minScore
  if (filters.orderBy) params.orderBy = filters.orderBy

  const { data } = await api.get<ProvidersResponse>('/providers', { params })
  return data
}

export async function getProviderById(id: string): Promise<ProviderDetail> {
  const { data } = await api.get<ProviderDetail>(`/providers/${id}`)
  return data
}

export async function getMyProviderProfile(): Promise<ProviderDetail> {
  const { data } = await api.get<ProviderDetail>('/providers/me/profile')
  return data
}

export async function createProvider(payload: ProviderUpsertPayload): Promise<ProviderDetail> {
  const { data } = await api.post<ProviderDetail>('/providers', payload)
  return data
}

export async function updateProvider(id: string, payload: ProviderUpsertPayload): Promise<ProviderDetail> {
  const { data } = await api.put<ProviderDetail>(`/providers/${id}`, payload)
  return data
}

export async function createReview(
  providerId: string,
  payload: { rating: number; comment?: string }
): Promise<ProviderReview> {
  const { data } = await api.post<ProviderReview>(`/providers/${providerId}/reviews`, payload)
  return data
}

export async function listProviderReviews(
  providerId: string,
  page = 1,
  limit = 10
): Promise<ReviewsResponse> {
  const { data } = await api.get<ReviewsResponse>(`/providers/${providerId}/reviews`, {
    params: { page, limit }
  })
  return data
}

export async function replyToReview(
  providerId: string,
  reviewId: string,
  reply: string
): Promise<ProviderReview> {
  const { data } = await api.patch<ProviderReview>(
    `/providers/${providerId}/reviews/${reviewId}/reply`,
    { reply }
  )
  return data
}

function simulateMockProviders(
  filters: Partial<ProviderFilters>,
  page: number,
  limit: number
): ProvidersResponse {
  let results = [...MOCK_PROVIDERS]

  if (filters.search) {
    const q = filters.search.toLowerCase()
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.services.some((s) => s.description?.toLowerCase().includes(q))
    )
  }

  if (filters.category) {
    results = results.filter((p) => p.services.some((s) => s.category === filters.category))
  }

  if (filters.region) {
    results = results.filter((p) => p.region === filters.region)
  }

  if (filters.minScore && filters.minScore > 0) {
    results = results.filter((p) => p.score >= (filters.minScore as number))
  }

  if (filters.orderBy === 'score') {
    results.sort((a, b) => b.score - a.score)
  } else if (filters.orderBy === 'name') {
    results.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  } else {
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const total = results.length
  const start = (page - 1) * limit
  const data = results.slice(start, start + limit)

  return { data, total, page, limit }
}
