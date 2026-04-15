"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const auth_validator_1 = require("../validators/auth.validator");
const REFRESH_EXPIRES_DAYS = 7;
function signAccess(userId, role) {
    return jsonwebtoken_1.default.sign({ sub: userId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
}
function signRefresh(userId) {
    return jsonwebtoken_1.default.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: `${REFRESH_EXPIRES_DAYS}d`
    });
}
async function storeRefreshToken(token, userId) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);
    await prisma_1.prisma.refreshToken.create({ data: { token, userId, expiresAt } });
}
async function register(req, res) {
    const data = auth_validator_1.registerSchema.parse(req.body);
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
        res.status(409).json({ error: 'El email ya está registrado' });
        return;
    }
    const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
    const user = await prisma_1.prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            phone: data.phone,
            role: data.role
        }
    });
    const accessToken = signAccess(user.id, user.role);
    const refreshToken = signRefresh(user.id);
    await storeRefreshToken(refreshToken, user.id);
    res.status(201).json({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
}
async function login(req, res) {
    const data = auth_validator_1.loginSchema.parse(req.body);
    const user = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.active) {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
    }
    const valid = await bcryptjs_1.default.compare(data.password, user.password);
    if (!valid) {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
    }
    const accessToken = signAccess(user.id, user.role);
    const refreshToken = signRefresh(user.id);
    await storeRefreshToken(refreshToken, user.id);
    const provider = user.role === 'PROVEEDOR'
        ? await prisma_1.prisma.provider.findUnique({
            where: { userId: user.id },
            select: { id: true }
        })
        : null;
    res.json({
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            providerId: provider?.id ?? null
        }
    });
}
async function refresh(req, res) {
    const { refreshToken } = auth_validator_1.refreshSchema.parse(req.body);
    const stored = await prisma_1.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
        res.status(401).json({ error: 'Refresh token inválido o expirado' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || !user.active) {
            res.status(401).json({ error: 'Usuario no encontrado' });
            return;
        }
        // Rotar token: eliminar el anterior y crear uno nuevo
        await prisma_1.prisma.refreshToken.delete({ where: { token: refreshToken } });
        const newAccess = signAccess(user.id, user.role);
        const newRefresh = signRefresh(user.id);
        await storeRefreshToken(newRefresh, user.id);
        res.json({ accessToken: newAccess, refreshToken: newRefresh });
    }
    catch {
        res.status(401).json({ error: 'Refresh token inválido' });
    }
}
async function logout(req, res) {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await prisma_1.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.status(204).send();
}
//# sourceMappingURL=auth.controller.js.map