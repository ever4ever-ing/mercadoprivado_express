import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
export declare function requireRole(...roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
