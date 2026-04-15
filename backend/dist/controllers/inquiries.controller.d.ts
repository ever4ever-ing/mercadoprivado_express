import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare function createInquiry(req: AuthRequest, res: Response): Promise<void>;
export declare function listReceivedInquiries(req: AuthRequest, res: Response): Promise<void>;
export declare function updateInquiryStatus(req: AuthRequest, res: Response): Promise<void>;
