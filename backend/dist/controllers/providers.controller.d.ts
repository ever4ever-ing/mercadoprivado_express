import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare function listProviders(req: AuthRequest, res: Response): Promise<void>;
export declare function getProvider(req: AuthRequest, res: Response): Promise<void>;
export declare function createProvider(req: AuthRequest, res: Response): Promise<void>;
export declare function updateProvider(req: AuthRequest, res: Response): Promise<void>;
