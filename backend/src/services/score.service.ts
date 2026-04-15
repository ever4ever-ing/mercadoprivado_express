// Se llama automáticamente cada vez que se crea o elimina una reseña.

import { Badge } from '@prisma/client'
import { prisma } from '../lib/prisma'

function computeBadge(score: number, reviewCount: number): Badge | null {
  if (reviewCount < 2) return null // Mínimo 2 reseñas para tener badge
  if (score >= 4.5) return Badge.GOLD
  if (score >= 3.5) return Badge.SILVER
  if (score >= 2.5) return Badge.BRONZE
  return null
}

export async function recalculateScore(providerId: string): Promise<void> {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: { reviews: { where: { reported: false } } }
  })

  if (!provider) throw new Error(`Proveedor ${providerId} no encontrado`)

  // Score = promedio ponderado de reseñas (verificadas cuentan doble)
  const reviewCount = provider.reviews.length
  let newScore = 0
  if (reviewCount > 0) {
    const { weightedSum, totalWeight } = provider.reviews.reduce(
      (acc, r) => {
        const w = r.verified ? 2 : 1
        return { weightedSum: acc.weightedSum + r.rating * w, totalWeight: acc.totalWeight + w }
      },
      { weightedSum: 0, totalWeight: 0 }
    )
    newScore = parseFloat((weightedSum / totalWeight).toFixed(2))
  }

  const newBadge = computeBadge(newScore, reviewCount)

  if (newScore !== provider.score) {
    await prisma.scoreLog.create({
      data: {
        providerId,
        scoreBefore: provider.score,
        scoreAfter:  newScore,
        reason:      'recalculate'
      }
    })
  }

  await prisma.provider.update({
    where: { id: providerId },
    data: { score: newScore, badge: newBadge, reviewCount }
  })
}
