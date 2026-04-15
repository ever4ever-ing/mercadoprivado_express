import { Response } from 'express'
import { Prisma, ProviderStatus, DocumentStatus, Role } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { recalculateScore } from '../services/score.service'

export async function listProviders(req: AuthRequest, res: Response): Promise<void> {
  const page   = Math.max(1,  parseInt(req.query.page   as string) || 1)
  const limit  = Math.min(50, parseInt(req.query.limit  as string) || 20)
  const status = req.query.status as ProviderStatus | undefined

  const where: Prisma.ProviderWhereInput = status ? { status } : {}

  const [total, providers] = await Promise.all([
    prisma.provider.count({ where }),
    prisma.provider.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        user:     { select: { email: true, name: true, phone: true } },
        services: { select: { category: true, title: true } },
        _count:   { select: { reviews: true, inquiries: true } }
      }
    })
  ])

  res.json({ data: providers, total, page, limit })
}

export async function updateProviderStatus(req: AuthRequest, res: Response): Promise<void> {
  const { id }   = req.params
  const { status } = req.body

  if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
    res.status(400).json({ error: 'Estado inválido. Usa: ACTIVE, SUSPENDED o PENDING' })
    return
  }

  const provider = await prisma.provider.findUnique({ where: { id } })
  if (!provider) {
    res.status(404).json({ error: 'Proveedor no encontrado' })
    return
  }

  const updated = await prisma.provider.update({
    where: { id },
    data:  { status }
  })

  res.json(updated)
}

export async function deleteReview(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params

  const review = await prisma.review.findUnique({ where: { id } })
  if (!review) {
    res.status(404).json({ error: 'Reseña no encontrada' })
    return
  }

  await prisma.review.delete({ where: { id } })
  await recalculateScore(review.providerId)

  res.status(204).send()
}

export async function verifyDocument(req: AuthRequest, res: Response): Promise<void> {
  const { id }              = req.params
  const { status, reviewNote } = req.body

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    res.status(400).json({ error: 'Estado inválido. Usa: APPROVED o REJECTED' })
    return
  }

  const doc = await prisma.providerDocument.findUnique({ where: { id } })
  if (!doc) {
    res.status(404).json({ error: 'Documento no encontrado' })
    return
  }

  const updated = await prisma.providerDocument.update({
    where: { id },
    data: {
      status:     status as DocumentStatus,
      reviewedAt: new Date(),
      reviewNote: reviewNote || null
    }
  })

  // Si se aprueba o rechaza un documento, recalcular score
  await recalculateScore(doc.providerId)

  res.json(updated)
}

export async function getStats(req: AuthRequest, res: Response): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalProviders,
    activeProviders,
    pendingProviders,
    suspendedProviders,
    totalInquiries,
    inquiriesLastMonth,
    totalReviews,
    reviewsLastMonth,
    totalEmpresas,
    totalProveedores,
    inactiveUsers
  ] = await Promise.all([
    prisma.provider.count(),
    prisma.provider.count({ where: { status: 'ACTIVE' } }),
    prisma.provider.count({ where: { status: 'PENDING' } }),
    prisma.provider.count({ where: { status: 'SUSPENDED' } }),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.review.count(),
    prisma.review.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { role: Role.EMPRESA } }),
    prisma.user.count({ where: { role: Role.PROVEEDOR } }),
    prisma.user.count({ where: { active: false } })
  ])

  res.json({
    providers: {
      total:     totalProviders,
      active:    activeProviders,
      pending:   pendingProviders,
      suspended: suspendedProviders
    },
    inquiries: {
      total:     totalInquiries,
      lastMonth: inquiriesLastMonth
    },
    reviews: {
      total:     totalReviews,
      lastMonth: reviewsLastMonth
    },
    users: {
      empresas:   totalEmpresas,
      proveedores: totalProveedores,
      inactive:   inactiveUsers
    }
  })
}

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  const page  = Math.max(1,  parseInt(req.query.page  as string) || 1)
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20)
  const role  = req.query.role as Role | undefined
  const search = req.query.search as string | undefined

  const where: Prisma.UserWhereInput = {
    role: role ?? { in: [Role.EMPRESA, Role.PROVEEDOR] },
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { name:  { contains: search, mode: 'insensitive' } }
      ]
    })
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id:        true,
        email:     true,
        name:      true,
        role:      true,
        phone:     true,
        active:    true,
        createdAt: true,
        provider:  { select: { id: true, businessName: true, status: true } }
      }
    })
  ])

  res.json({ data: users, total, page, limit })
}

export async function setUserActive(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params
  const { active } = req.body

  if (typeof active !== 'boolean') {
    res.status(400).json({ error: 'El campo "active" debe ser true o false' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' })
    return
  }
  if (user.role === Role.ADMIN) {
    res.status(403).json({ error: 'No se puede modificar a otro administrador' })
    return
  }

  const updated = await prisma.user.update({
    where: { id },
    data:  { active },
    select: { id: true, email: true, name: true, role: true, active: true }
  })

  res.json(updated)
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' })
    return
  }
  if (user.role === Role.ADMIN) {
    res.status(403).json({ error: 'No se puede eliminar a otro administrador' })
    return
  }

  await prisma.user.delete({ where: { id } })

  res.status(204).send()
}
