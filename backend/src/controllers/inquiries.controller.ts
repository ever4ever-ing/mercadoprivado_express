import { Response } from 'express'
import { Prisma, InquiryStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { createInquirySchema, updateInquiryStatusSchema } from '../validators/inquiry.validator'
import { sendInquiryNotification } from '../services/mail.service'

export async function createInquiry(req: AuthRequest, res: Response): Promise<void> {
  const senderId = req.user!.id
  const data = createInquirySchema.parse(req.body)

  const provider = await prisma.provider.findFirst({
    where:   { id: data.providerId, status: 'ACTIVE' },
    include: { user: { select: { email: true, name: true } } }
  })
  if (!provider) {
    res.status(404).json({ error: 'Proveedor no encontrado' })
    return
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      providerId:    data.providerId,
      senderId,
      contactName:   data.contactName,
      company:       data.company,
      serviceNeeded: data.serviceNeeded,
      description:   data.description,
      phone:         data.phone,
      email:         data.email
    }
  })

  // Notificación por correo (sin bloquear respuesta)
  sendInquiryNotification({
    providerEmail: provider.user.email,
    providerName:  provider.businessName,
    contactName:   data.contactName,
    company:       data.company,
    serviceNeeded: data.serviceNeeded,
    description:   data.description,
    phone:         data.phone,
    contactEmail:  data.email
  }).catch((e) => console.error('Email error:', e))

  res.status(201).json(inquiry)
}

export async function listReceivedInquiries(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id

  const provider = await prisma.provider.findUnique({ where: { userId } })
  if (!provider) {
    res.status(404).json({ error: 'No tienes perfil de proveedor' })
    return
  }

  const page   = Math.max(1,  parseInt(req.query.page   as string) || 1)
  const limit  = Math.min(50, parseInt(req.query.limit  as string) || 20)
  const status = req.query.status as InquiryStatus | undefined

  const where: Prisma.InquiryWhereInput = {
    providerId: provider.id,
    ...(status && { status })
  }

  const [total, inquiries] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit
    })
  ])

  res.json({ data: inquiries, total, page, limit })
}

export async function updateInquiryStatus(req: AuthRequest, res: Response): Promise<void> {
  const { id }   = req.params
  const userId   = req.user!.id
  const { status } = updateInquiryStatusSchema.parse(req.body)

  const provider = await prisma.provider.findUnique({ where: { userId } })
  if (!provider) {
    res.status(404).json({ error: 'No tienes perfil de proveedor' })
    return
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: { id, providerId: provider.id }
  })
  if (!inquiry) {
    res.status(404).json({ error: 'Solicitud no encontrada' })
    return
  }

  const updated = await prisma.inquiry.update({
    where: { id },
    data: {
      status,
      ...(status === 'REPLIED' && { repliedAt: new Date() }),
      ...(status === 'CLOSED'  && { closedAt:  new Date() })
    }
  })

  res.json(updated)
}
