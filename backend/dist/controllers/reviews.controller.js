"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReviews = listReviews;
exports.createReview = createReview;
const prisma_1 = require("../lib/prisma");
const review_validator_1 = require("../validators/review.validator");
const score_service_1 = require("../services/score.service");
async function listReviews(req, res) {
    const { id: providerId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const [total, reviews] = await Promise.all([
        prisma_1.prisma.review.count({ where: { providerId, reported: false } }),
        prisma_1.prisma.review.findMany({
            where: { providerId, reported: false },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                rating: true,
                comment: true,
                verified: true,
                createdAt: true,
                author: { select: { name: true } }
            }
        })
    ]);
    res.json({ data: reviews, total, page, limit });
}
async function createReview(req, res) {
    const { id: providerId } = req.params;
    const authorId = req.user.id;
    const provider = await prisma_1.prisma.provider.findFirst({
        where: { id: providerId, status: 'ACTIVE' }
    });
    if (!provider) {
        res.status(404).json({ error: 'Proveedor no encontrado' });
        return;
    }
    // Un usuario no puede reseñar su propio perfil
    if (provider.userId === authorId) {
        res.status(403).json({ error: 'No puedes reseñar tu propio perfil' });
        return;
    }
    const existing = await prisma_1.prisma.review.findUnique({
        where: { providerId_authorId: { providerId, authorId } }
    });
    if (existing) {
        res.status(409).json({ error: 'Ya dejaste una reseña para este proveedor' });
        return;
    }
    const data = review_validator_1.createReviewSchema.parse(req.body);
    const review = await prisma_1.prisma.review.create({
        data: { providerId, authorId, rating: data.rating, comment: data.comment },
        select: {
            id: true,
            rating: true,
            comment: true,
            verified: true,
            createdAt: true,
            author: { select: { name: true } }
        }
    });
    // Recalcular score en background (no bloquea la respuesta)
    (0, score_service_1.recalculateScore)(providerId).catch((e) => console.error('Score recalc error:', e));
    res.status(201).json(review);
}
//# sourceMappingURL=reviews.controller.js.map