import { Request, Response, NextFunction } from 'express';
type AsyncHandler = (req: Request | any, res: Response, next: NextFunction) => Promise<unknown>;
export declare function catchAsync(fn: AsyncHandler): (req: Request, res: Response, next: NextFunction) => void;
export {};
