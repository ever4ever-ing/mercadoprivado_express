"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInquiryStatusSchema = exports.createInquirySchema = void 0;
const zod_1 = require("zod");
exports.createInquirySchema = zod_1.z.object({
    providerId: zod_1.z.string().uuid('ID de proveedor inválido'),
    contactName: zod_1.z.string().min(2, 'Nombre muy corto').max(100),
    company: zod_1.z.string().max(100).optional(),
    serviceNeeded: zod_1.z.string().min(2, 'Servicio requerido').max(100),
    description: zod_1.z.string().min(10, 'Descripción muy corta').max(2000),
    phone: zod_1.z.string().max(20).optional(),
    email: zod_1.z.string().email('Email inválido')
});
exports.updateInquiryStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['REPLIED', 'CLOSED'])
});
//# sourceMappingURL=inquiry.validator.js.map