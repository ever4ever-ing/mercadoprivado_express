import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare function listReviews(req: Request, res: Response): Promise<void>;
export declare function createReview(req: AuthRequest, res: Response): Promise<void>;
