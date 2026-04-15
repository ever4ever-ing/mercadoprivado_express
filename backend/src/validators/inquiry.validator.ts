import { z } from 'zod'

export const createInquirySchema = z.object({
  providerId: z.string().uuid('ID de proveedor inválido'),
  contactName: z.string().min(2, 'Nombre muy corto').max(100),
  company: z.string().max(100).optional(),
  serviceNeeded: z.string().min(2, 'Servicio requerido').max(100),
  description: z.string().min(10, 'Descripción muy corta').max(2000),
  phone: z.string().max(20).optional(),
  email: z.string().email('Email inválido')
})

export const updateInquiryStatusSchema = z.object({
  status: z.enum(['REPLIED', 'CLOSED'])
})
