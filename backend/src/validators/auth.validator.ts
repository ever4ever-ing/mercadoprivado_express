import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  name: z.string().min(2, 'Nombre muy corto').max(100),
  phone: z.string().optional(),
  role: z.enum(['EMPRESA', 'PROVEEDOR']).default('EMPRESA')
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Contraseña requerida')
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido')
})
