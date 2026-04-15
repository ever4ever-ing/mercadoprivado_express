import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'

import authRouter      from './routes/auth.routes'
import providersRouter from './routes/providers.routes'
import inquiriesRouter from './routes/inquiries.routes'
import adminRouter     from './routes/admin.routes'
import { errorHandler } from './middleware/error.middleware'
import { prisma } from './lib/prisma'

const app = express()

// ── CORS ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  })
)

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))

// ── Rate limiting en auth ─────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max:      20,
  message:  { error: 'Demasiados intentos. Espera 15 minutos.' }
})

// ── Rutas ─────────────────────────────────────────────────────────
app.use('/api/auth',      authLimiter, authRouter)
app.use('/api/providers', providersRouter)
app.use('/api/inquiries', inquiriesRouter)
app.use('/api/admin',     adminRouter)

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Error handler (debe ir al final) ──────────────────────────────
app.use(errorHandler)

// ── Servidor ──────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000')

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}\n`)
})

// Cerrar Prisma al apagar
process.on('SIGINT',  () => prisma.$disconnect().then(() => process.exit(0)))
process.on('SIGTERM', () => prisma.$disconnect().then(() => process.exit(0)))
