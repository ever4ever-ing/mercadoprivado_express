"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            error: 'Datos inválidos',
            issues: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message
            }))
        });
        return;
    }
    if (err instanceof Error) {
        console.error(`[Error] ${err.message}`);
        res.status(500).json({ error: err.message || 'Error interno del servidor' });
        return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
}
//# sourceMappingURL=error.middleware.js.map