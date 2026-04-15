"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerFiltersSchema = exports.updateProviderSchema = exports.createProviderSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const serviceSchema = zod_1.z.object({
    category: zod_1.z.nativeEnum(client_1.Category),
    title: zod_1.z.string().min(2, 'Título muy corto').max(100),
    description: zod_1.z.string().max(500).optional(),
    priceFrom: zod_1.z.number().positive().optional(),
    priceTo: zod_1.z.number().positive().optional()
});
exports.createProviderSchema = zod_1.z.object({
    businessName: zod_1.z.string().min(2, 'Nombre muy corto').max(100),
    description: zod_1.z.string().max(1000).optional(),
    region: zod_1.z.string().min(2, 'Región requerida'),
    city: zod_1.z.string().max(100).optional(),
    address: zod_1.z.string().max(200).optional(),
    website: zod_1.z.string().url('URL inválida').optional().or(zod_1.z.literal('')),
    services: zod_1.z.array(serviceSchema).min(1, 'Debe tener al menos un servicio')
});
exports.updateProviderSchema = exports.createProviderSchema.partial();
exports.providerFiltersSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    category: zod_1.z.nativeEnum(client_1.Category).optional(),
    region: zod_1.z.string().optional(),
    minScore: zod_1.z.coerce.number().min(0).max(5).optional(),
    orderBy: zod_1.z.enum(['score', 'createdAt', 'name']).optional().default('score'),
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(20)
});
//# sourceMappingURL=provider.validator.js.map