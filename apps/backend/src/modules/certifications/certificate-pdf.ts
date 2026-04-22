import puppeteer from "puppeteer";
import QRCode from "qrcode";
import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { systemSettingsService } from "../system-settings/system-settings.service";

const certTypeLabels: Record<string, string> = {
  TRANSCRIPT: "Historial Académico",
  DEGREE: "Título Profesional",
  COMPLETION: "Certificado de Terminación",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "ACTIVO",
  REVOKED: "REVOCADO",
  EXPIRED: "VENCIDO",
};

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function generateCertificatePdf(
  certId: string,
  baseUrl: string,
): Promise<Buffer> {
  const cert = await prisma.certification.findUnique({
    where: { id: certId },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          career: { select: { name: true, code: true } },
        },
      },
      career: { select: { name: true } },
      issuer: { select: { firstName: true, lastName: true } },
    },
  });

  if (!cert) throw new HttpError(404, "Certification not found");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings: any = await systemSettingsService.get().catch(() => null);

  const verifyUrl = `${baseUrl}/verify/${cert.verificationCode}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 160,
    margin: 1,
    color: { dark: "#1a237e", light: "#ffffff" },
  });

  const studentName = `${cert.student.user.firstName} ${cert.student.user.lastName}`;
  const careerName = cert.career?.name ?? cert.student.career?.name ?? "—";
  const issuerName = cert.issuer
    ? `${cert.issuer.firstName} ${cert.issuer.lastName}`
    : "—";
  const certTypeLabel =
    certTypeLabels[cert.certificationType] ?? cert.certificationType;
  const statusLabel = statusLabels[cert.status] ?? cert.status;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #1a1a2e;
    }

    .page {
      width: 210mm;
      height: 297mm;
      padding: 0;
      position: relative;
      overflow: hidden;
    }

    /* Decorative border */
    .border-frame {
      position: absolute;
      inset: 12mm;
      border: 3px solid #1a237e;
      border-radius: 4px;
      pointer-events: none;
    }
    .border-frame::before {
      content: '';
      position: absolute;
      inset: 3px;
      border: 1px solid #c5cae9;
      border-radius: 3px;
    }

    /* Corner ornaments */
    .corner { position: absolute; width: 40px; height: 40px; }
    .corner svg { width: 100%; height: 100%; }
    .corner-tl { top: 14mm; left: 14mm; }
    .corner-tr { top: 14mm; right: 14mm; transform: rotate(90deg); }
    .corner-bl { bottom: 14mm; left: 14mm; transform: rotate(-90deg); }
    .corner-br { bottom: 14mm; right: 14mm; transform: rotate(180deg); }

    .content {
      position: relative;
      z-index: 1;
      padding: 18mm 28mm 16mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 297mm;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 6mm;
    }

    .logo-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      box-shadow: 0 4px 12px rgba(26, 35, 126, 0.3);
    }

    .logo-circle svg { width: 36px; height: 36px; fill: white; }

    .institution-name {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: #1a237e;
      margin-bottom: 4px;
    }

    .institution-sub {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #5c6bc0;
    }

    /* Divider */
    .divider {
      width: 100%;
      max-width: 480px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #1a237e, transparent);
      margin: 5mm 0;
    }

    /* Certificate type */
    .cert-type {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #1a237e;
      margin-bottom: 4mm;
    }

    .cert-preamble {
      font-size: 13px;
      color: #616161;
      margin-bottom: 2mm;
    }

    /* Student name */
    .student-name {
      font-size: 32px;
      font-weight: 700;
      color: #1a237e;
      margin-bottom: 3mm;
      text-align: center;
    }

    .career-name {
      font-size: 15px;
      font-weight: 500;
      color: #455a64;
      margin-bottom: 5mm;
    }

    /* Details grid */
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4mm 16mm;
      width: 100%;
      max-width: 420px;
      margin-bottom: 6mm;
    }

    .detail-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #9e9e9e;
      margin-bottom: 2px;
    }

    .detail-value {
      font-size: 13px;
      font-weight: 600;
      color: #212121;
    }

    .status-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      background: #e8f5e9;
      color: #2e7d32;
    }
    .status-badge.revoked { background: #ffebee; color: #c62828; }
    .status-badge.expired { background: #fff3e0; color: #e65100; }

    /* QR section */
    .qr-section {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 16px;
      border: 1px dashed #bdbdbd;
      border-radius: 8px;
      background: #fafafa;
      margin-bottom: 5mm;
    }

    .qr-section img { width: 90px; height: 90px; }

    .qr-info {
      text-align: left;
    }

    .qr-info .label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #9e9e9e;
      margin-bottom: 4px;
    }

    .qr-info .code {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      font-weight: 700;
      color: #1a237e;
      word-break: break-all;
      margin-bottom: 6px;
    }

    .qr-info .url {
      font-size: 9px;
      color: #757575;
      word-break: break-all;
    }

    /* Signatures */
    .signatures {
      display: flex;
      justify-content: space-between;
      width: 100%;
      max-width: 440px;
      margin-top: auto;
      padding-top: 6mm;
    }

    .sig-block {
      text-align: center;
      width: 160px;
    }

    .sig-img {
      width: 120px;
      height: 48px;
      object-fit: contain;
      margin-bottom: 2px;
    }

    .sig-line {
      width: 100%;
      height: 1px;
      background: #424242;
      margin-bottom: 6px;
    }

    .sig-name {
      font-size: 11px;
      font-weight: 600;
      color: #212121;
    }

    .sig-title {
      font-size: 9px;
      color: #757575;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 3mm;
    }

    .footer-text {
      font-size: 8px;
      color: #bdbdbd;
      letter-spacing: 0.5px;
    }

    .hash-text {
      font-family: 'Courier New', monospace;
      font-size: 7px;
      color: #bdbdbd;
      margin-top: 2px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Decorative border -->
    <div class="border-frame"></div>

    <!-- Corner ornaments -->
    <div class="corner corner-tl">
      <svg viewBox="0 0 40 40"><path d="M0 40 L0 8 Q0 0 8 0 L40 0" fill="none" stroke="#1a237e" stroke-width="2"/></svg>
    </div>
    <div class="corner corner-tr">
      <svg viewBox="0 0 40 40"><path d="M0 40 L0 8 Q0 0 8 0 L40 0" fill="none" stroke="#1a237e" stroke-width="2"/></svg>
    </div>
    <div class="corner corner-bl">
      <svg viewBox="0 0 40 40"><path d="M0 40 L0 8 Q0 0 8 0 L40 0" fill="none" stroke="#1a237e" stroke-width="2"/></svg>
    </div>
    <div class="corner corner-br">
      <svg viewBox="0 0 40 40"><path d="M0 40 L0 8 Q0 0 8 0 L40 0" fill="none" stroke="#1a237e" stroke-width="2"/></svg>
    </div>

    <div class="content">
      <!-- Header -->
      <div class="header">
        <div class="logo-circle">
          <svg viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
        </div>
        <div class="institution-name">Academicore</div>
        <div class="institution-sub">Instituto Tecnológico Superior</div>
      </div>

      <div class="divider"></div>

      <!-- Certificate type -->
      <div class="cert-type">${certTypeLabel}</div>

      <div class="cert-preamble">Se certifica que el/la estudiante</div>

      <!-- Student name -->
      <div class="student-name">${studentName}</div>
      <div class="career-name">${careerName}</div>

      <!-- Details -->
      <div class="details">
        <div>
          <div class="detail-label">Fecha de Emisión</div>
          <div class="detail-value">${formatDate(cert.issuedAt)}</div>
        </div>
        <div>
          <div class="detail-label">Fecha de Vencimiento</div>
          <div class="detail-value">${formatDate(cert.expiresAt)}</div>
        </div>
        <div>
          <div class="detail-label">Emitido por</div>
          <div class="detail-value">${issuerName}</div>
        </div>
        <div>
          <div class="detail-label">Estado</div>
          <span class="status-badge ${cert.status === "REVOKED" ? "revoked" : cert.status === "EXPIRED" ? "expired" : ""}">${statusLabel}</span>
        </div>
      </div>

      <!-- QR Code -->
      <div class="qr-section">
        <img src="${qrDataUrl}" alt="QR de verificación" />
        <div class="qr-info">
          <div class="label">Código de Verificación</div>
          <div class="code">${cert.verificationCode}</div>
          <div class="url">Verifique en: ${verifyUrl}</div>
        </div>
      </div>

      <!-- Signatures -->
      <div class="signatures">
        <div class="sig-block">
          ${settings?.signatureImage1 ? `<img class="sig-img" src="${settings.signatureImage1}" alt="Firma 1" />` : ""}
          <div class="sig-line"></div>
          <div class="sig-name">${settings?.signatureName1 ?? issuerName}</div>
          <div class="sig-title">${settings?.signatureTitle1 ?? "Autoridad Emisora"}</div>
        </div>
        <div class="sig-block">
          ${settings?.signatureImage2 ? `<img class="sig-img" src="${settings.signatureImage2}" alt="Firma 2" />` : ""}
          <div class="sig-line"></div>
          <div class="sig-name">${settings?.signatureName2 ?? "Director Académico"}</div>
          <div class="sig-title">${settings?.signatureTitle2 ?? "Academicore"}</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-text">
          Este documento ha sido emitido digitalmente por Academicore — Sistema de Gestión Académica Institucional
        </div>
        <div class="hash-text">SHA-256: ${cert.documentHash}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
