import { Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import {
  createProviderSchema,
  updateProviderSchema,
  providerFiltersSchema
} from '../validators/provider.validator'

// Perfil completo: descripción + (web o dirección) + al menos 1 servicio
function computeProfileComplete(data: {
  description?: string | null
  website?:     string | null
  address?:     string | null
  city?:        string | null
  servicesCount: number
}): boolean {
  return !!(
    data.description?.trim() &&
    (data.website?.trim() || data.address?.trim() || data.city?.trim()) &&
    data.servicesCount > 0
  )
}

// Mapea el modelo DB al shape que espera el frontend
function toPublicProvider(
  p: Prisma.ProviderGetPayload<{ include: { services: true; user: { select: { phone: true } } } }>
) {
  return {
    ...p,
    name:     p.businessName,
    verified: p.profileComplete,
    phone:    p.user.phone
  }
}

export async function listProviders(req: AuthRequest, res: Response): Promise<void> {
  const f = providerFiltersSchema.parse(req.query)

  const where: Prisma.ProviderWhereInput = { status: 'ACTIVE' }

  if (f.search) {
    where.OR = [
      { businessName: { contains: f.search, mode: 'insensitive' } },
      { description:  { contains: f.search, mode: 'insensitive' } },
      { services: { some: { title: { contains: f.search, mode: 'insensitive' } } } }
    ]
  }

  if (f.category) {
    where.services = { some: { category: f.category } }
  }

  if (f.region) {
    where.region = { equals: f.region, mode: 'insensitive' }
  }

  if (f.minScore !== undefined) {
    where.score = { gte: f.minScore }
  }

  const orderBy: Prisma.ProviderOrderByWithRelationInput =
    f.orderBy === 'score'     ? { score:        'desc' } :
    f.orderBy === 'name'      ? { businessName: 'asc'  } :
                                { createdAt:    'desc' }

  const [total, providers] = await Promise.all([
    prisma.provider.count({ where }),
    prisma.provider.findMany({
      where,
      orderBy,
      skip: (f.page - 1) * f.limit,
      take: f.limit,
      include: {
        services: true,
        user: { select: { phone: true } }
      }
    })
  ])

  res.json({
    data:  providers.map(toPublicProvider),
    total,
    page:  f.page,
    limit: f.limit
  })
}

export async function getProvider(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params

  const provider = await prisma.provider.findFirst({
    where: { id, status: 'ACTIVE' },
    include: {
      user: { select: { phone: true } },
      services:  true,
      portfolio: { orderBy: { order: 'asc' } },
      reviews: {
        where:   { reported: false },
        orderBy: { createdAt: 'desc' },
        take:    5,
        select: {
          id:            true,
          rating:        true,
          comment:       true,
          verified:      true,
          providerReply: true,
          repliedAt:     true,
          createdAt:     true,
          author:        { select: { name: true } }
        }
      }
    }
  })

  if (!provider) {
    res.status(404).json({ error: 'Proveedor no encontrado' })
    return
  }

  res.json({
    ...provider,
    name: provider.businessName,
    verified: provider.profileComplete,
    phone: provider.user.phone
  })
}

export async function getMyProviderProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id

  const provider = await prisma.provider.findUnique({
    where: { userId },
    include: {
      user: { select: { phone: true } },
      services: true,
      portfolio: { orderBy: { order: 'asc' } },
      reviews: {
        where: { reported: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          rating: true,
          comment: true,
          verified: true,
          createdAt: true,
          author: { select: { name: true } }
        }
      }
    }
  })

  if (!provider) {
    res.status(404).json({ error: 'Tu cuenta aún no tiene perfil de proveedor creado.' })
    return
  }

  res.json({
    ...provider,
    name: provider.businessName,
    verified: provider.profileComplete,
    phone: provider.user.phone
  })
}

export async function createProvider(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id

  const existing = await prisma.provider.findUnique({ where: { userId } })
  if (existing) {
    res.status(409).json({ error: 'Ya tienes un perfil de proveedor' })
    return
  }

  const data = createProviderSchema.parse(req.body)

  const provider = await prisma.provider.create({
    data: {
      userId,
      businessName:    data.businessName,
      description:     data.description,
      region:          data.region,
      city:            data.city,
      address:         data.address,
      website:         data.website || null,
      profileComplete: computeProfileComplete({
        description:   data.description,
        website:       data.website,
        address:       data.address,
        city:          data.city,
        servicesCount: data.services.length
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.status === undefined && { status: 'ACTIVE' }),
      services: { create: data.services }
    },
    include: { services: true }
  })

  res.status(201).json({ ...provider, name: provider.businessName })
}

export async function updateProvider(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params
  const userId  = req.user!.id

  const provider = await prisma.provider.findFirst({ where: { id, userId }, include: { services: true } })
  if (!provider) {
    res.status(404).json({ error: 'Proveedor no encontrado o sin permiso' })
    return
  }

  const data = updateProviderSchema.parse(req.body)

  const updated = await prisma.$transaction(async (tx) => {
    if (data.services) {
      await tx.service.deleteMany({ where: { providerId: id } })
    }
    const merged = {
      description: data.description  ?? provider.description,
      website:     data.website      ?? provider.website,
      address:     data.address      ?? provider.address,
      city:        data.city         ?? provider.city,
      servicesCount: data.services   ? data.services.length : provider.services?.length ?? 0
    }
    return tx.provider.update({
      where: { id },
      data: {
        ...(data.businessName !== undefined && { businessName: data.businessName }),
        ...(data.description  !== undefined && { description:  data.description }),
        ...(data.region       !== undefined && { region:       data.region }),
        ...(data.city         !== undefined && { city:         data.city }),
        ...(data.address      !== undefined && { address:      data.address }),
        ...(data.website      !== undefined && { website:      data.website || null }),
        ...(data.status       !== undefined && { status:       data.status }),
        ...(data.status === undefined && provider.status === 'PENDING' && { status: 'ACTIVE' }),
        ...(data.services     !== undefined && { services: { create: data.services } }),
        profileComplete: computeProfileComplete(merged)
      },
      include: { services: true }
    })
  })

  res.json({ ...updated, name: updated.businessName })
}
