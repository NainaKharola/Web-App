const fs = require("fs");
const path = require("path");

const logoPath = path.join(__dirname, "..", "templates", "drdo_logo.png");
const logoUrl = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
  : "";

const bgPath = path.join(__dirname, "..", "templates", "drdo_certificate_template.png");
const bgUrl = fs.existsSync(bgPath)
  ? `data:image/png;base64,${fs.readFileSync(bgPath).toString("base64")}`
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

function generateCertificateHtml(student, renderMode = "full") {
  const training = student.trainingManagement || {};
  
  const fromDate = formatDate(training.fromDate);
  const toDate = formatDate(training.toDate);
  const completionDate = formatDate(training.completionDate || student.completedDate || new Date());
  
  const studentNameClass = `${(student.name || "").toUpperCase()} (${(student.course || "").toUpperCase()} ${(student.year || "").toUpperCase()}, ${(student.branch || "").toUpperCase()})`;
  const instituteName = training.collegeName || student.collegeName || "";
  const instituteLocation = training.collegeLocation || student.location || student.collegeAddress || "";
  const collegeNameAddress = `${instituteName.toUpperCase()}${instituteLocation ? `, ${instituteLocation.toUpperCase()}` : ""}`;
  
  const perf = (training.leaveAvailed || training.performance || "").trim().toLowerCase();
  
  let performanceClass = "";
  if (perf.includes("outstanding")) {
    performanceClass = "outstanding";
  } else if (perf.includes("very good") || perf.includes("verygood")) {
    performanceClass = "very-good";
  } else if (perf.includes("good") && !perf.includes("very")) {
    performanceClass = "good";
  } else if (perf.includes("average")) {
    performanceClass = "average";
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
    background-image: ${renderMode === "template" ? "none" : `url('${bgUrl}')`};
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
    font-family: 'Times New Roman', Times, serif;
    color: #000000;
    -webkit-print-color-adjust: exact;
  }
  .field {
    position: absolute;
    width: 102mm;
    font-size: 16px;
    font-weight: normal;
    color: #000000;
    font-family: 'Times New Roman', Times, serif;
    line-height: 1.2;
    white-space: normal;
    word-break: normal;
    overflow-wrap: break-word;
  }
  /* Each value is an independently positioned text box on the printed form. */
  /* A consistent 2 mm gap after each pre-printed colon. */
  .student-class-field { top: 84.8mm; left: 102mm; width: 84mm; }
  .institute-field { top: 102.6mm; left: 102mm; width: 84mm; }
  .commencement-date-field { top: 118.2mm; left: 102mm; width: 48mm; }
  .completion-date-field { top: 136.1mm; left: 102mm; width: 48mm; }
  .details-field {
    position: absolute;
    top: 168mm;
    left: 24mm;
    width: 162mm;
    height: 44mm;
    padding: 6mm 8mm;
    font-size: 16px;
    line-height: 1.2;
    color: #000000;
    font-family: 'Times New Roman', Times, serif;
    white-space: normal;
    word-break: normal;
    overflow-wrap: break-word;
    display: grid;
    align-content: start;
  }
  .details-field__title {
    display: block;
    width: 100%;
    font-weight: bold;
    text-align: center;
  }
  .dated-field {
    /* Align the date baseline with the printed "Dated" label. */
    top: 261mm;
    left: 47mm;
    width: 42mm;
    line-height: 1.2;
  }
  .performance-mark {
    top: 231.2mm;
    width: 8mm;
    font-size: 20px;
    color: #000000;
    font-family: 'Times New Roman', Times, serif;
  }
  .performance-mark--outstanding { left: 72.8mm; }
  .performance-mark--very-good { left: 119.5mm; }
  .performance-mark--good { left: 154.5mm; }
  .performance-mark--average { left: 189.5mm; }
</style>
</head>
<body>
  <!-- 1. Name of Student & Class -->
  <div class="field student-class-field">
    ${escapeHtml(studentNameClass)}
  </div>

  <!-- 2. Name of Institute -->
  <div class="field institute-field">
    ${escapeHtml(collegeNameAddress)}
  </div>

  <!-- 3. Date of Commencement of Training -->
  <div class="field commencement-date-field">
    ${escapeHtml(fromDate)}
  </div>

  <!-- 4. Date of Completion of Training -->
  <div class="field completion-date-field">
    ${escapeHtml(toDate)}
  </div>

  <!-- 5. Brief Details of Training Box (Project Title Only, Uppercase, Center aligned) -->
  <div class="details-field">
    <div class="details-field__title">${detailsHtml}</div>
  </div>

  <!-- 6. Overall Performance Checkmark -->
  ${performanceClass ? `<div class="field performance-mark performance-mark--${performanceClass}">✔</div>` : ""}

  <!-- Dated -->
  <div class="field dated-field">
    ${escapeHtml(completionDate)}
  </div>
</body>
</html>`;
}

module.exports = { certificateFileName, generateCertificateHtml };
