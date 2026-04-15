import { Router } from 'express'
import * as admin from '../controllers/admin.controller'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { catchAsync } from '../lib/catchAsync'

const router = Router()

// Todos los endpoints de admin requieren autenticación + rol ADMIN
router.use(authenticate, requireRole('ADMIN'))

router.get('/stats',                       catchAsync(admin.getStats))
router.get('/providers',                   catchAsync(admin.listProviders))
router.patch('/providers/:id/status',      catchAsync(admin.updateProviderStatus))
router.delete('/reviews/:id',              catchAsync(admin.deleteReview))
router.patch('/documents/:id/status',      catchAsync(admin.verifyDocument))

// Gestión de usuarios registrados
router.get('/users',                       catchAsync(admin.listUsers))
router.patch('/users/:id/active',          catchAsync(admin.setUserActive))
router.delete('/users/:id',               catchAsync(admin.deleteUser))

export default router
