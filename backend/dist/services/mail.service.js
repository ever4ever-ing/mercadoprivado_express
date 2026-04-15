"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInquiryNotification = sendInquiryNotification;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
async function sendInquiryNotification(p) {
    await transporter.sendMail({
        from: `"Mercado Privado Chile" <${process.env.SMTP_FROM}>`,
        to: p.providerEmail,
        subject: `Nueva solicitud de cotización — ${p.serviceNeeded}`,
        html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#c0392b;padding:20px 24px">
          <h2 style="color:white;margin:0;font-size:18px">Nueva solicitud de cotización</h2>
        </div>
        <div style="padding:24px">
          <p style="color:#374151">Hola <strong>${p.providerName}</strong>, has recibido una nueva solicitud en Mercado Privado Chile.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:140px">Servicio solicitado</td>
                <td style="padding:8px 0;color:#111827;font-size:14px"><strong>${p.serviceNeeded}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Descripción</td>
                <td style="padding:8px 0;color:#111827;font-size:14px">${p.description}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;border-top:1px solid #f3f4f6">Contacto</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;border-top:1px solid #f3f4f6"><strong>${p.contactName}</strong></td></tr>
            ${p.company ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Empresa</td>
                <td style="padding:8px 0;color:#111827;font-size:14px">${p.company}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Email</td>
                <td style="padding:8px 0;color:#111827;font-size:14px">${p.contactEmail}</td></tr>
            ${p.phone ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Teléfono</td>
                <td style="padding:8px 0;color:#111827;font-size:14px">${p.phone}</td></tr>` : ''}
          </table>
          <p style="margin-top:24px;color:#6b7280;font-size:13px">Puedes responder esta solicitud desde tu panel de proveedor.</p>
        </div>
      </div>
    `
    });
}
//# sourceMappingURL=mail.service.js.map