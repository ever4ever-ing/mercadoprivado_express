import { Router } from 'express'
import * as auth from '../controllers/auth.controller'
import { catchAsync } from '../lib/catchAsync'

const router = Router()

router.post('/register', catchAsync(auth.register))
router.post('/login',    catchAsync(auth.login))
router.post('/refresh',  catchAsync(auth.refresh))
router.post('/logout',   catchAsync(auth.logout))

export default router
