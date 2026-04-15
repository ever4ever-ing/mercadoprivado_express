"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const providers = __importStar(require("../controllers/providers.controller"));
const reviews = __importStar(require("../controllers/reviews.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const catchAsync_1 = require("../lib/catchAsync");
const router = (0, express_1.Router)();
// Rutas públicas
router.get('/', (0, catchAsync_1.catchAsync)(providers.listProviders));
router.get('/:id', (0, catchAsync_1.catchAsync)(providers.getProvider));
// Reseñas del proveedor
router.get('/:id/reviews', (0, catchAsync_1.catchAsync)(reviews.listReviews));
router.post('/:id/reviews', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('EMPRESA'), (0, catchAsync_1.catchAsync)(reviews.createReview));
// Panel del proveedor (autenticado)
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('PROVEEDOR'), (0, catchAsync_1.catchAsync)(providers.createProvider));
router.put('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('PROVEEDOR'), (0, catchAsync_1.catchAsync)(providers.updateProvider));
exports.default = router;
//# sourceMappingURL=providers.routes.js.map