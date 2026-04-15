import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { createReviewSchema } from '../validators/review.validator'
import { recalculateScore } from '../services/score.service'
import { sendReviewNotification } from '../services/mail.service'

export async function listReviews(req: Request, res: Response): Promise<void> {
  const { id: providerId } = req.params
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10)

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where: { providerId, reported: false } }),
    prisma.review.findMany({
      where:   { providerId, reported: false },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
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
    })
  ])

  res.json({ data: reviews, total, page, limit })
}

export async function createReview(req: AuthRequest, res: Response): Promise<void> {
  const { id: providerId } = req.params
  const authorId = req.user!.id

  const provider = await prisma.provider.findFirst({
    where: { id: providerId, status: 'ACTIVE' },
    include: { user: { select: { email: true } } }
  })
  if (!provider) {
    res.status(404).json({ error: 'Proveedor no encontrado' })
    return
  }

  // Un usuario no puede reseñar su propio perfil
  if (provider.userId === authorId) {
    res.status(403).json({ error: 'No puedes reseñar tu propio perfil' })
    return
  }

  const existing = await prisma.review.findUnique({
    where: { providerId_authorId: { providerId, authorId } }
  })
  if (existing) {
    res.status(409).json({ error: 'Ya dejaste una reseña para este proveedor' })
    return
  }

  const data = createReviewSchema.parse(req.body)

  // Una reseña se marca como verificada si existe al menos una Inquiry cerrada
  // entre esta empresa (authorId) y el proveedor — prueba de contratación real
  const closedInquiry = await prisma.inquiry.findFirst({
    where: { providerId, senderId: authorId, status: 'CLOSED' }
  })

  const review = await prisma.review.create({
    data: { providerId, authorId, rating: data.rating, comment: data.comment, verified: !!closedInquiry },
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
  })

  // Tareas en background (no bloquean la respuesta)
  recalculateScore(providerId).catch((e) => console.error('Score recalc error:', e))
  sendReviewNotification({
    providerEmail: provider.user.email,
    providerName:  provider.businessName,
    authorName:    review.author?.name ?? 'Una empresa',
    rating:        review.rating,
    comment:       review.comment ?? undefined,
    verified:      review.verified
  }).catch((e) => console.error('Review email error:', e))

  res.status(201).json(review)
}

export async function replyToReview(req: AuthRequest, res: Response): Promise<void> {
  const { reviewId } = req.params
  const userId = req.user!.id
  const { reply } = req.body

  if (!reply || typeof reply !== 'string' || !reply.trim()) {
    res.status(400).json({ error: 'La respuesta no puede estar vacía' })
    return
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { provider: { select: { userId: true } } }
  })

  if (!review) {
    res.status(404).json({ error: 'Reseña no encontrada' })
    return
  }

  if (review.provider.userId !== userId) {
    res.status(403).json({ error: 'No tienes permiso para responder esta reseña' })
    return
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { providerReply: reply.trim(), repliedAt: new Date() },
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
  })

  res.json(updated)
}
