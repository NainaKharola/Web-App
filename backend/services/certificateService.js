const fs = require("fs");
const path = require("path");

const logoPath = path.join(__dirname, "..", "templates", "drdo_logo.png");
const logoUrl = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
  : "";

const bgPath = path.join(__dirname, "..", "templates", "drdo_certificate_template.jpg");
const bgUrl = fs.existsSync(bgPath)
  ? `data:image/jpeg;base64,${fs.readFileSync(bgPath).toString("base64")}`
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
    month: "2-digit",
    year: "numeric",
  });
}

function certificateFileName(student) {
  const refId = student.referenceId || "UNKNOWN";
  const nameNoSpaces = (student.name || "Student").replace(/\s+/g, "");

  return `Certificate_${refId}_${nameNoSpaces}.pdf`;
}

function generateCertificateHtml(student) {
  const training = student.trainingManagement || {};
  
  const fromDate = formatDate(training.fromDate);
  const toDate = formatDate(training.toDate);
  const completionDate = formatDate(training.completionDate || student.completedDate || new Date());
  
  const studentNameClass = `${(student.name || "").toUpperCase()} (${(student.course || "").toUpperCase()} ${(student.year || "").toUpperCase()}, ${(student.branch || "").toUpperCase()})`;
  const collegeNameAddress = `${(student.collegeName || "").toUpperCase()}${student.collegeAddress ? `, ${(student.collegeAddress || "").toUpperCase()}` : ""}`;
  
  const perf = (training.leaveAvailed || training.performance || "").trim().toLowerCase();
  
  let checkLeft = "";
  if (perf.includes("outstanding")) {
    checkLeft = "72.8mm";
  } else if (perf.includes("very good") || perf.includes("verygood")) {
    checkLeft = "119.5mm";
  } else if (perf.includes("good") && !perf.includes("very")) {
    checkLeft = "154.5mm";
  } else if (perf.includes("average")) {
    checkLeft = "189.5mm";
  }

  const projectTitle = (training.projectTitle || "").trim();
  const detailsHtml = projectTitle ? `"${escapeHtml(projectTitle.toUpperCase())}"` : "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    padding: 0;
    width: 210mm;
    height: 297mm;
    position: relative;
    background-image: url('${bgUrl}');
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
    font-family: Georgia, 'Times New Roman', Times, serif;
    color: black;
    -webkit-print-color-adjust: exact;
  }
  .field {
    position: absolute;
    font-size: 16px;
    font-weight: normal;
    color: black;
    font-family: Georgia, 'Times New Roman', Times, serif;
    line-height: 1;
  }
  .details-box {
    position: absolute;
    top: 168mm;
    left: 24mm;
    width: 162mm;
    height: 44mm;
    font-size: 16px;
    line-height: 1.6;
    color: black;
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-weight: bold;
    text-align: center;
    padding: 8px 12px;
    overflow: hidden;
  }
</style>
</head>
<body>
  <!-- 1. Name of Student & Class -->
  <div class="field" style="top: 86.8mm; left: 84mm; max-width: 102mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
    ${escapeHtml(studentNameClass)}
  </div>

  <!-- 2. Name of Institute -->
  <div class="field" style="top: 104.6mm; left: 84mm; max-width: 102mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
    ${escapeHtml(collegeNameAddress)}
  </div>

  <!-- 3. Date of Commencement of Training -->
  <div class="field" style="top: 122.3mm; left: 108mm;">
    ${escapeHtml(fromDate)}
  </div>

  <!-- 4. Date of Completion of Training -->
  <div class="field" style="top: 140.2mm; left: 108mm;">
    ${escapeHtml(toDate)}
  </div>

  <!-- 5. Brief Details of Training Box (Project Title Only, Uppercase, Center aligned) -->
  <div class="details-box">
    ${detailsHtml}
  </div>

  <!-- 6. Overall Performance Checkmark -->
  ${checkLeft ? `<div class="field" style="top: 231.2mm; left: ${checkLeft}; font-size: 20px; color: black; font-family: Georgia, 'Times New Roman', Times, serif;">✔</div>` : ""}

  <!-- Dated -->
  <div class="field" style="top: 263.2mm; left: 60mm;">
    ${escapeHtml(completionDate)}
  </div>
</body>
</html>`;
}

module.exports = { certificateFileName, generateCertificateHtml };
