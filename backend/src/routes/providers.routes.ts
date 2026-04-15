import { Router } from 'express'
import * as providers from '../controllers/providers.controller'
import * as reviews from '../controllers/reviews.controller'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { catchAsync } from '../lib/catchAsync'

const router = Router()

// Rutas públicas
router.get('/',    catchAsync(providers.listProviders))
router.get('/me/profile', authenticate, requireRole('PROVEEDOR'), catchAsync(providers.getMyProviderProfile))
router.get('/:id', catchAsync(providers.getProvider))

// Reseñas del proveedor
router.get('/:id/reviews',  catchAsync(reviews.listReviews))
router.post(
  '/:id/reviews',
  authenticate,
  requireRole('EMPRESA'),
  catchAsync(reviews.createReview)
)
router.patch(
  '/:id/reviews/:reviewId/reply',
  authenticate,
  requireRole('PROVEEDOR'),
  catchAsync(reviews.replyToReview)
)

// Panel del proveedor (autenticado)
router.post('/',    authenticate, requireRole('PROVEEDOR'), catchAsync(providers.createProvider))
router.put('/:id',  authenticate, requireRole('PROVEEDOR'), catchAsync(providers.updateProvider))

export default router
