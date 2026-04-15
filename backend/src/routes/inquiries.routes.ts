import { Router } from 'express'
import * as inquiries from '../controllers/inquiries.controller'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { catchAsync } from '../lib/catchAsync'

const router = Router()

// Enviar solicitud de contacto (solo empresas)
router.post(
  '/',
  authenticate,
  requireRole('EMPRESA'),
  catchAsync(inquiries.createInquiry)
)

// Panel del proveedor: ver y gestionar solicitudes recibidas
router.get(
  '/received',
  authenticate,
  requireRole('PROVEEDOR'),
  catchAsync(inquiries.listReceivedInquiries)
)

router.patch(
  '/:id/status',
  authenticate,
  requireRole('PROVEEDOR'),
  catchAsync(inquiries.updateInquiryStatus)
)

export default router
