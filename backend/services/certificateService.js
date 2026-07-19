const fs = require("fs");
const path = require("path");

const logoPath = path.join(__dirname, "..", "templates", "drdo_logo.png");
const logoUrl = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
  : "";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function certificateFileName(student) {
  const safeName = String(student.name || "Student")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");

  return `${safeName || "Student"}_Certificate.pdf`;
}

function generateCertificateHtml(student) {
  const training = student.trainingManagement || {};
  const duration = training.trainingDuration || student.internshipDuration || "";

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #102a43; font-family: Georgia, 'Times New Roman', serif; }
  .certificate { min-height: 180mm; padding: 17mm 20mm; border: 4px solid #0b4f8a; outline: 2px solid #c9a34e; outline-offset: -10px; text-align: center; }
  .logo { width: 64px; height: 64px; object-fit: contain; }
  .eyebrow { margin: 8px 0 2px; color: #0b4f8a; font: 700 13px Arial, sans-serif; letter-spacing: 1.5px; }
  h1 { margin: 10px 0 18px; color: #0b4f8a; font-size: 38px; letter-spacing: 2px; }
  .presented { font: 16px Arial, sans-serif; }
  h2 { margin: 12px 0; color: #8a6519; font-size: 32px; }
  .copy { max-width: 800px; margin: 0 auto; font-size: 18px; line-height: 1.7; }
  .duration { margin: 21px auto; color: #0b4f8a; font-weight: 700; font-size: 20px; }
  .footer { display: flex; justify-content: space-between; align-items: end; margin-top: 32px; font: 14px Arial, sans-serif; text-align: left; }
  .signature { min-width: 220px; border-top: 1px solid #102a43; padding-top: 8px; text-align: center; }
</style></head><body><main class="certificate">
  ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="DRDO logo" />` : ""}
  <p class="eyebrow">DEFENCE RESEARCH AND DEVELOPMENT ORGANISATION</p>
  <h1>CERTIFICATE OF COMPLETION</h1>
  <p class="presented">This is to certify that</p>
  <h2>${escapeHtml(student.name)}</h2>
  <p class="copy">of <strong>${escapeHtml(student.collegeName)}</strong>, ${escapeHtml(student.course)} (${escapeHtml(student.branch)}), has successfully completed internship training at DRDO.</p>
  <p class="duration">Training period: ${escapeHtml(formatDate(training.fromDate))} to ${escapeHtml(formatDate(training.toDate))}${duration ? ` (${escapeHtml(duration)})` : ""}</p>
  <p class="copy">The student completed the assigned training requirements to the satisfaction of the organisation.</p>
  <div class="footer"><div>Reference ID: ${escapeHtml(student.referenceId)}</div><div class="signature">Authorised Signatory<br />DRDO</div></div>
</main></body></html>`;
}

module.exports = { certificateFileName, generateCertificateHtml };
