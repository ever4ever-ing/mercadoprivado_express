import { z } from 'zod'
import { Category, ProviderStatus } from '@prisma/client'

const serviceSchema = z.object({
  category: z.nativeEnum(Category),
  title: z.string().min(2, 'Título muy corto').max(100),
  description: z.string().max(500).optional(),
  priceFrom: z.number().positive().optional(),
  priceTo: z.number().positive().optional()
})

export const createProviderSchema = z.object({
  businessName: z.string().min(2, 'Nombre muy corto').max(100),
  description: z.string().max(1000).optional(),
  region: z.string().min(2, 'Región requerida'),
  city: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  status: z.nativeEnum(ProviderStatus).optional(),
  services: z.array(serviceSchema).min(1, 'Debe tener al menos un servicio')
})

export const updateProviderSchema = createProviderSchema.partial()

export const providerFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.nativeEnum(Category).optional(),
  region: z.string().optional(),
  minScore: z.coerce.number().min(0).max(5).optional(),
  orderBy: z.enum(['score', 'createdAt', 'name']).optional().default('score'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20)
})
