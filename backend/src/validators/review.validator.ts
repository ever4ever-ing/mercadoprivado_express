import { z } from 'zod'

export const createReviewSchema = z.object({
  rating: z
    .number({ required_error: 'Rating requerido' })
    .int()
    .min(1, 'Mínimo 1 estrella')
    .max(5, 'Máximo 5 estrellas'),
  comment: z.string().max(1000).optional()
})
