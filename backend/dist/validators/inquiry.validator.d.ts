import { z } from 'zod';
export declare const createInquirySchema: z.ZodObject<{
    providerId: z.ZodString;
    contactName: z.ZodString;
    company: z.ZodOptional<z.ZodString>;
    serviceNeeded: z.ZodString;
    description: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    description: string;
    providerId: string;
    contactName: string;
    serviceNeeded: string;
    phone?: string | undefined;
    company?: string | undefined;
}, {
    email: string;
    description: string;
    providerId: string;
    contactName: string;
    serviceNeeded: string;
    phone?: string | undefined;
    company?: string | undefined;
}>;
export declare const updateInquiryStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["REPLIED", "CLOSED"]>;
}, "strip", z.ZodTypeAny, {
    status: "REPLIED" | "CLOSED";
}, {
    status: "REPLIED" | "CLOSED";
}>;
