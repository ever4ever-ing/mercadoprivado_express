import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos inválidos',
      issues: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }))
    })
    return
  }

  if (err instanceof Error) {
    console.error(`[Error] ${err.message}`)
    res.status(500).json({ error: err.message || 'Error interno del servidor' })
    return
  }

  res.status(500).json({ error: 'Error interno del servidor' })
}
