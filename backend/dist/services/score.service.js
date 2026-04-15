"use strict";
// Se llama automáticamente cada vez que cambia algo que afecta el score:
//   - Se crea o elimina una reseña
//   - Se aprueba un documento
//   - Se actualiza el tiempo de respuesta
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateScore = recalculateScore;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
// Pesos del score (deben sumar 1.0)
const WEIGHTS = {
    reviews: 0.5, // Promedio de calificaciones 1–5
    documents: 0.3, // % de documentos requeridos aprobados
    activity: 0.2 // Basado en tiempo de respuesta promedio
};
const REQUIRED_DOCUMENTS = ['RUT', 'INICIO_ACTIVIDADES', 'SEGURO_RESPONSABILIDAD'];
function computeBadge(score, reviewCount) {
    if (reviewCount < 2)
        return null; // Mínimo 2 reseñas para tener badge
    if (score >= 4.5)
        return client_1.Badge.GOLD;
    if (score >= 3.5)
        return client_1.Badge.SILVER;
    if (score >= 2.5)
        return client_1.Badge.BRONZE;
    return null;
}
function activityScore(responseTimeHs) {
    if (responseTimeHs === null)
        return 3.0; // Sin datos → score neutro
    if (responseTimeHs < 2)
        return 5.0;
    if (responseTimeHs < 8)
        return 4.0;
    if (responseTimeHs < 24)
        return 3.0;
    if (responseTimeHs < 48)
        return 2.0;
    return 1.0;
}
async function recalculateScore(providerId) {
    const provider = await prisma_1.prisma.provider.findUnique({
        where: { id: providerId },
        include: {
            reviews: { where: { reported: false } },
            documents: true
        }
    });
    if (!provider)
        throw new Error(`Proveedor ${providerId} no encontrado`);
    // 1. Score de reseñas (0–5)
    const reviewCount = provider.reviews.length;
    const reviewAvg = reviewCount > 0
        ? provider.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;
    // 2. Score de documentos (0–5)
    const approvedDocs = provider.documents.filter((d) => d.status === 'APPROVED' && REQUIRED_DOCUMENTS.includes(d.type)).length;
    const docScore = (approvedDocs / REQUIRED_DOCUMENTS.length) * 5;
    // 3. Score de actividad (0–5)
    const actScore = activityScore(provider.responseTimeHs);
    // Score final ponderado (escala 0–5, redondeado a 2 decimales)
    const newScore = parseFloat((reviewAvg * WEIGHTS.reviews +
        docScore * WEIGHTS.documents +
        actScore * WEIGHTS.activity).toFixed(2));
    const newBadge = computeBadge(newScore, reviewCount);
    // Guardar en log de auditoría si el score cambió
    if (newScore !== provider.score) {
        await prisma_1.prisma.scoreLog.create({
            data: {
                providerId,
                scoreBefore: provider.score,
                scoreAfter: newScore,
                reason: 'recalculate'
            }
        });
    }
    await prisma_1.prisma.provider.update({
        where: { id: providerId },
        data: {
            score: newScore,
            badge: newBadge,
            reviewCount
        }
    });
}
//# sourceMappingURL=score.service.js.map