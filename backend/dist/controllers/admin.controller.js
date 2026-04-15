"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProviders = listProviders;
exports.updateProviderStatus = updateProviderStatus;
exports.deleteReview = deleteReview;
exports.verifyDocument = verifyDocument;
exports.getStats = getStats;
const prisma_1 = require("../lib/prisma");
const score_service_1 = require("../services/score.service");
async function listProviders(req, res) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const status = req.query.status;
    const where = status ? { status } : {};
    const [total, providers] = await Promise.all([
        prisma_1.prisma.provider.count({ where }),
        prisma_1.prisma.provider.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: { select: { email: true, name: true, phone: true } },
                services: { select: { category: true, title: true } },
                _count: { select: { reviews: true, inquiries: true } }
            }
        })
    ]);
    res.json({ data: providers, total, page, limit });
}
async function updateProviderStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
        res.status(400).json({ error: 'Estado inválido. Usa: ACTIVE, SUSPENDED o PENDING' });
        return;
    }
    const provider = await prisma_1.prisma.provider.findUnique({ where: { id } });
    if (!provider) {
        res.status(404).json({ error: 'Proveedor no encontrado' });
        return;
    }
    const updated = await prisma_1.prisma.provider.update({
        where: { id },
        data: { status }
    });
    res.json(updated);
}
async function deleteReview(req, res) {
    const { id } = req.params;
    const review = await prisma_1.prisma.review.findUnique({ where: { id } });
    if (!review) {
        res.status(404).json({ error: 'Reseña no encontrada' });
        return;
    }
    await prisma_1.prisma.review.delete({ where: { id } });
    await (0, score_service_1.recalculateScore)(review.providerId);
    res.status(204).send();
}
async function verifyDocument(req, res) {
    const { id } = req.params;
    const { status, reviewNote } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
        res.status(400).json({ error: 'Estado inválido. Usa: APPROVED o REJECTED' });
        return;
    }
    const doc = await prisma_1.prisma.providerDocument.findUnique({ where: { id } });
    if (!doc) {
        res.status(404).json({ error: 'Documento no encontrado' });
        return;
    }
    const updated = await prisma_1.prisma.providerDocument.update({
        where: { id },
        data: {
            status: status,
            reviewedAt: new Date(),
            reviewNote: reviewNote || null
        }
    });
    // Si se aprueba o rechaza un documento, recalcular score
    await (0, score_service_1.recalculateScore)(doc.providerId);
    res.json(updated);
}
async function getStats(req, res) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalProviders, activeProviders, pendingProviders, suspendedProviders, totalInquiries, inquiriesLastMonth, totalReviews, reviewsLastMonth] = await Promise.all([
        prisma_1.prisma.provider.count(),
        prisma_1.prisma.provider.count({ where: { status: 'ACTIVE' } }),
        prisma_1.prisma.provider.count({ where: { status: 'PENDING' } }),
        prisma_1.prisma.provider.count({ where: { status: 'SUSPENDED' } }),
        prisma_1.prisma.inquiry.count(),
        prisma_1.prisma.inquiry.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma_1.prisma.review.count(),
        prisma_1.prisma.review.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
    ]);
    res.json({
        providers: {
            total: totalProviders,
            active: activeProviders,
            pending: pendingProviders,
            suspended: suspendedProviders
        },
        inquiries: {
            total: totalInquiries,
            lastMonth: inquiriesLastMonth
        },
        reviews: {
            total: totalReviews,
            lastMonth: reviewsLastMonth
        }
    });
}
//# sourceMappingURL=admin.controller.js.map