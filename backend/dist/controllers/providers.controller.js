"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProviders = listProviders;
exports.getProvider = getProvider;
exports.createProvider = createProvider;
exports.updateProvider = updateProvider;
const prisma_1 = require("../lib/prisma");
const provider_validator_1 = require("../validators/provider.validator");
// Mapea el modelo DB al shape que espera el frontend
function toPublicProvider(p) {
    return {
        ...p,
        name: p.businessName,
        verified: p.profileComplete
    };
}
async function listProviders(req, res) {
    const f = provider_validator_1.providerFiltersSchema.parse(req.query);
    const where = { status: 'ACTIVE' };
    if (f.search) {
        where.OR = [
            { businessName: { contains: f.search, mode: 'insensitive' } },
            { description: { contains: f.search, mode: 'insensitive' } },
            { services: { some: { title: { contains: f.search, mode: 'insensitive' } } } }
        ];
    }
    if (f.category) {
        where.services = { some: { category: f.category } };
    }
    if (f.region) {
        where.region = { equals: f.region, mode: 'insensitive' };
    }
    if (f.minScore !== undefined) {
        where.score = { gte: f.minScore };
    }
    const orderBy = f.orderBy === 'score' ? { score: 'desc' } :
        f.orderBy === 'name' ? { businessName: 'asc' } :
            { createdAt: 'desc' };
    const [total, providers] = await Promise.all([
        prisma_1.prisma.provider.count({ where }),
        prisma_1.prisma.provider.findMany({
            where,
            orderBy,
            skip: (f.page - 1) * f.limit,
            take: f.limit,
            include: { services: true }
        })
    ]);
    res.json({
        data: providers.map(toPublicProvider),
        total,
        page: f.page,
        limit: f.limit
    });
}
async function getProvider(req, res) {
    const { id } = req.params;
    const provider = await prisma_1.prisma.provider.findFirst({
        where: { id, status: 'ACTIVE' },
        include: {
            services: true,
            portfolio: { orderBy: { order: 'asc' } },
            reviews: {
                where: { reported: false },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    verified: true,
                    createdAt: true,
                    author: { select: { name: true } }
                }
            }
        }
    });
    if (!provider) {
        res.status(404).json({ error: 'Proveedor no encontrado' });
        return;
    }
    res.json({ ...provider, name: provider.businessName, verified: provider.profileComplete });
}
async function createProvider(req, res) {
    const userId = req.user.id;
    const existing = await prisma_1.prisma.provider.findUnique({ where: { userId } });
    if (existing) {
        res.status(409).json({ error: 'Ya tienes un perfil de proveedor' });
        return;
    }
    const data = provider_validator_1.createProviderSchema.parse(req.body);
    const provider = await prisma_1.prisma.provider.create({
        data: {
            userId,
            businessName: data.businessName,
            description: data.description,
            region: data.region,
            city: data.city,
            address: data.address,
            website: data.website || null,
            services: { create: data.services }
        },
        include: { services: true }
    });
    res.status(201).json({ ...provider, name: provider.businessName });
}
async function updateProvider(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const provider = await prisma_1.prisma.provider.findFirst({ where: { id, userId } });
    if (!provider) {
        res.status(404).json({ error: 'Proveedor no encontrado o sin permiso' });
        return;
    }
    const data = provider_validator_1.updateProviderSchema.parse(req.body);
    const updated = await prisma_1.prisma.$transaction(async (tx) => {
        if (data.services) {
            await tx.service.deleteMany({ where: { providerId: id } });
        }
        return tx.provider.update({
            where: { id },
            data: {
                ...(data.businessName !== undefined && { businessName: data.businessName }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.region !== undefined && { region: data.region }),
                ...(data.city !== undefined && { city: data.city }),
                ...(data.address !== undefined && { address: data.address }),
                ...(data.website !== undefined && { website: data.website || null }),
                ...(data.services !== undefined && { services: { create: data.services } })
            },
            include: { services: true }
        });
    });
    res.json({ ...updated, name: updated.businessName });
}
//# sourceMappingURL=providers.controller.js.map