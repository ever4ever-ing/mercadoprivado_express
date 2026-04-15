interface InquiryNotificationParams {
    providerEmail: string;
    providerName: string;
    contactName: string;
    company?: string;
    serviceNeeded: string;
    description: string;
    phone?: string;
    contactEmail: string;
}
export declare function sendInquiryNotification(p: InquiryNotificationParams): Promise<void>;
export {};
