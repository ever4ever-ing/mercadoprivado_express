"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    rating: zod_1.z
        .number({ required_error: 'Rating requerido' })
        .int()
        .min(1, 'Mínimo 1 estrella')
        .max(5, 'Máximo 5 estrellas'),
    comment: zod_1.z.string().max(1000).optional()
});
//# sourceMappingURL=review.validator.js.map