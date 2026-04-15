"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = require("express-rate-limit");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const providers_routes_1 = __importDefault(require("./routes/providers.routes"));
const inquiries_routes_1 = __importDefault(require("./routes/inquiries.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const prisma_1 = require("./lib/prisma");
const app = (0, express_1.default)();
// ── CORS ──────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
// ── Body parsing ──────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '1mb' }));
// ── Rate limiting en auth ─────────────────────────────────────────
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20,
    message: { error: 'Demasiados intentos. Espera 15 minutos.' }
});
// ── Rutas ─────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, auth_routes_1.default);
app.use('/api/providers', providers_routes_1.default);
app.use('/api/inquiries', inquiries_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// ── Health check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ── Error handler (debe ir al final) ──────────────────────────────
app.use(error_middleware_1.errorHandler);
// ── Servidor ──────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`   ENV: ${process.env.NODE_ENV || 'development'}\n`);
});
// Cerrar Prisma al apagar
process.on('SIGINT', () => prisma_1.prisma.$disconnect().then(() => process.exit(0)));
process.on('SIGTERM', () => prisma_1.prisma.$disconnect().then(() => process.exit(0)));
//# sourceMappingURL=index.js.map