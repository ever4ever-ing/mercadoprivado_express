import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator'

const REFRESH_EXPIRES_DAYS = 7

function signAccess(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  } as jwt.SignOptions)
}

function signRefresh(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: `${REFRESH_EXPIRES_DAYS}d`
  } as jwt.SignOptions)
}

async function storeRefreshToken(token: string, userId: string) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS)
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } })
}

export async function register(req: Request, res: Response): Promise<void> {
  const data = registerSchema.parse(req.body)

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) {
    res.status(409).json({ error: 'El email ya está registrado' })
    return
  }

  const hashedPassword = await bcrypt.hash(data.password, 12)
  const user = await prisma.user.create({
    data: {
      email:    data.email,
      password: hashedPassword,
      name:     data.name,
      phone:    data.phone,
      role:     data.role
    }
  })

  const accessToken  = signAccess(user.id, user.role)
  const refreshToken = signRefresh(user.id)
  await storeRefreshToken(refreshToken, user.id)

  res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  })
}

export async function login(req: Request, res: Response): Promise<void> {
  const data = loginSchema.parse(req.body)

  const user = await prisma.user.findUnique({ where: { email: data.email } })
  if (!user || !user.active) {
    res.status(401).json({ error: 'Credenciales inválidas' })
    return
  }

  const valid = await bcrypt.compare(data.password, user.password)
  if (!valid) {
    res.status(401).json({ error: 'Credenciales inválidas' })
    return
  }

  const accessToken  = signAccess(user.id, user.role)
  const refreshToken = signRefresh(user.id)
  await storeRefreshToken(refreshToken, user.id)

  const provider =
    user.role === 'PROVEEDOR'
      ? await prisma.provider.findUnique({
          where:  { userId: user.id },
          select: { id: true }
        })
      : null

  res.json({
    accessToken,
    refreshToken,
    user: {
      id:         user.id,
      email:      user.email,
      name:       user.name,
      role:       user.role,
      providerId: provider?.id ?? null
    }
  })
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = refreshSchema.parse(req.body)

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ error: 'Refresh token inválido o expirado' })
    return
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { sub: string }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.active) {
      res.status(401).json({ error: 'Usuario no encontrado' })
      return
    }

    // Rotar token: eliminar el anterior y crear uno nuevo
    await prisma.refreshToken.delete({ where: { token: refreshToken } })

    const newAccess  = signAccess(user.id, user.role)
    const newRefresh = signRefresh(user.id)
    await storeRefreshToken(newRefresh, user.id)

    res.json({ accessToken: newAccess, refreshToken: newRefresh })
  } catch {
    res.status(401).json({ error: 'Refresh token inválido' })
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }
  res.status(204).send()
}
