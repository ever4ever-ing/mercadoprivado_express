import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

interface InquiryNotificationParams {
  providerEmail: string
  providerName:  string
  contactName:   string
  company?:      string
  serviceNeeded: string
  description:   string
  phone?:        string
  contactEmail:  string
}

export async function sendInquiryNotification(p: InquiryNotificationParams): Promise<void> {
  await transporter.sendMail({
    from:    `"Mercado Privado Chile" <${process.env.SMTP_FROM}>`,
    to:      p.providerEmail,
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
  })
}

interface ReviewNotificationParams {
  providerEmail: string
  providerName:  string
  authorName:    string
  rating:        number
  comment?:      string
  verified:      boolean
}

export async function sendReviewNotification(p: ReviewNotificationParams): Promise<void> {
  const stars = '★'.repeat(p.rating) + '☆'.repeat(5 - p.rating)
  await transporter.sendMail({
    from:    `"Mercado Privado Chile" <${process.env.SMTP_FROM}>`,
    to:      p.providerEmail,
    subject: `Nueva reseña recibida — ${stars}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#c0392b;padding:20px 24px">
          <h2 style="color:white;margin:0;font-size:18px">Nueva reseña en tu perfil</h2>
        </div>
        <div style="padding:24px">
          <p style="color:#374151">Hola <strong>${p.providerName}</strong>, <strong>${p.authorName}</strong> dejó una reseña en tu perfil.</p>
          <div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:6px">
            <p style="margin:0 0 8px;font-size:22px;color:#f59e0b">${stars}</p>
            ${p.comment ? `<p style="margin:0;color:#374151;font-size:14px">"${p.comment}"</p>` : ''}
            ${p.verified ? `<p style="margin:8px 0 0;font-size:12px;color:#059669">✓ Reseña verificada</p>` : ''}
          </div>
          <p style="color:#6b7280;font-size:13px">Puedes responder esta reseña desde tu panel de proveedor.</p>
        </div>
      </div>
    `
  })
}
