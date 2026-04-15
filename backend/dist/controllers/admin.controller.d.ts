import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare function listProviders(req: AuthRequest, res: Response): Promise<void>;
export declare function updateProviderStatus(req: AuthRequest, res: Response): Promise<void>;
export declare function deleteReview(req: AuthRequest, res: Response): Promise<void>;
export declare function verifyDocument(req: AuthRequest, res: Response): Promise<void>;
export declare function getStats(req: AuthRequest, res: Response): Promise<void>;
