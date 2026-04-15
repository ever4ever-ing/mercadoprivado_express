"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInquiry = createInquiry;
exports.listReceivedInquiries = listReceivedInquiries;
exports.updateInquiryStatus = updateInquiryStatus;
const prisma_1 = require("../lib/prisma");
const inquiry_validator_1 = require("../validators/inquiry.validator");
const mail_service_1 = require("../services/mail.service");
async function createInquiry(req, res) {
    const senderId = req.user.id;
    const data = inquiry_validator_1.createInquirySchema.parse(req.body);
    const provider = await prisma_1.prisma.provider.findFirst({
        where: { id: data.providerId, status: 'ACTIVE' },
        include: { user: { select: { email: true, name: true } } }
    });
    if (!provider) {
        res.status(404).json({ error: 'Proveedor no encontrado' });
        return;
    }
    const inquiry = await prisma_1.prisma.inquiry.create({
        data: {
            providerId: data.providerId,
            senderId,
            contactName: data.contactName,
            company: data.company,
            serviceNeeded: data.serviceNeeded,
            description: data.description,
            phone: data.phone,
            email: data.email
        }
    });
    // Notificación por correo (sin bloquear respuesta)
    (0, mail_service_1.sendInquiryNotification)({
        providerEmail: provider.user.email,
        providerName: provider.businessName,
        contactName: data.contactName,
        company: data.company,
        serviceNeeded: data.serviceNeeded,
        description: data.description,
        phone: data.phone,
        contactEmail: data.email
    }).catch((e) => console.error('Email error:', e));
    res.status(201).json(inquiry);
}
async function listReceivedInquiries(req, res) {
    const userId = req.user.id;
    const provider = await prisma_1.prisma.provider.findUnique({ where: { userId } });
    if (!provider) {
        res.status(404).json({ error: 'No tienes perfil de proveedor' });
        return;
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const status = req.query.status;
    const where = {
        providerId: provider.id,
        ...(status && { status })
    };
    const [total, inquiries] = await Promise.all([
        prisma_1.prisma.inquiry.count({ where }),
        prisma_1.prisma.inquiry.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        })
    ]);
    res.json({ data: inquiries, total, page, limit });
}
async function updateInquiryStatus(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const { status } = inquiry_validator_1.updateInquiryStatusSchema.parse(req.body);
    const provider = await prisma_1.prisma.provider.findUnique({ where: { userId } });
    if (!provider) {
        res.status(404).json({ error: 'No tienes perfil de proveedor' });
        return;
    }
    const inquiry = await prisma_1.prisma.inquiry.findFirst({
        where: { id, providerId: provider.id }
    });
    if (!inquiry) {
        res.status(404).json({ error: 'Solicitud no encontrada' });
        return;
    }
    const updated = await prisma_1.prisma.inquiry.update({
        where: { id },
        data: {
            status,
            ...(status === 'REPLIED' && { repliedAt: new Date() }),
            ...(status === 'CLOSED' && { closedAt: new Date() })
        }
    });
    res.json(updated);
}
//# sourceMappingURL=inquiries.controller.js.map