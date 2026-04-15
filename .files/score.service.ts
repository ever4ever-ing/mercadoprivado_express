// src/services/score.service.ts
// Se llama automáticamente cada vez que cambia algo que afecta el score:
//   - Se crea o elimina una reseña
//   - Se aprueba un documento
//   - Se actualiza el tiempo de respuesta

import { PrismaClient, Badge } from '@prisma/client'

const prisma = new PrismaClient()

// Pesos del score (deben sumar 1.0)
const WEIGHTS = {
  reviews: 0.5,       // Promedio de calificaciones 1–5
  documents: 0.3,     // % de documentos requeridos aprobados
  activity: 0.2,      // Basado en tiempo de respuesta promedio
}

// Documentos requeridos para score de verificación completo
const REQUIRED_DOCUMENTS = ['RUT', 'INICIO_ACTIVIDADES', 'SEGURO_RESPONSABILIDAD']

function computeBadge(score: number, reviewCount: number): Badge | null {
  if (reviewCount < 2) return null   // Mínimo 2 reseñas para tener badge
  if (score >= 4.5) return Badge.GOLD
  if (score >= 3.5) return Badge.SILVER
  if (score >= 2.5) return Badge.BRONZE
  return null
}

function activityScore(responseTimeHs: number | null): number {
  // Sin datos → score neutro de 3/5
  if (responseTimeHs === null) return 3.0
  // < 2h → 5.0, < 8h → 4.0, < 24h → 3.0, < 48h → 2.0, >= 48h → 1.0
  if (responseTimeHs < 2)  return 5.0
  if (responseTimeHs < 8)  return 4.0
  if (responseTimeHs < 24) return 3.0
  if (responseTimeHs < 48) return 2.0
  return 1.0
}

export async function recalculateScore(providerId: string): Promise<void> {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: {
      reviews: { where: { reported: false } },
      documents: true,
    },
  })

  if (!provider) throw new Error(`Proveedor ${providerId} no encontrado`)

  // 1. Score de reseñas (0–5)
  const reviewCount = provider.reviews.length
  const reviewAvg =
    reviewCount > 0
      ? provider.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0

  // 2. Score de documentos (0–5)
  const approvedDocs = provider.documents.filter(
    (d) => d.status === 'APPROVED' && REQUIRED_DOCUMENTS.includes(d.type)
  ).length
  const docScore = (approvedDocs / REQUIRED_DOCUMENTS.length) * 5

  // 3. Score de actividad (0–5)
  const actScore = activityScore(provider.responseTimeHs)

  // Score final ponderado (escala 0–5, redondeado a 2 decimales)
  const newScore = parseFloat(
    (
      reviewAvg  * WEIGHTS.reviews  +
      docScore   * WEIGHTS.documents +
      actScore   * WEIGHTS.activity
    ).toFixed(2)
  )

  const newBadge = computeBadge(newScore, reviewCount)

  // Guardar cambio en log de auditoría si el score cambió
  if (newScore !== provider.score) {
    await prisma.scoreLog.create({
      data: {
        providerId,
        scoreBefore: provider.score,
        scoreAfter: newScore,
        reason: 'recalculate',
      },
    })
  }

  await prisma.provider.update({
    where: { id: providerId },
    data: {
      score: newScore,
      badge: newBadge,
      reviewCount,
    },
  })
}
