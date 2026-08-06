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
  
  // Format dates
  const fromDate = formatDate(training.fromDate);
  const toDate = formatDate(training.toDate);
  const completionDate = formatDate(training.completionDate || student.completedDate || new Date());
  
  // Sizing Class Name
  const studentNameClass = `${student.name || ""} (${student.course || ""} ${student.branch || ""})`;
  
  // Performance Checkboxes coordinates
  const perf = (training.leaveAvailed || training.performance || "Outstanding").trim().toLowerCase();
  
  let checkLeft = "81mm";
  if (perf.includes("very good") || perf.includes("verygood")) {
    checkLeft = "121.5mm";
  } else if (perf.includes("good") && !perf.includes("very")) {
    checkLeft = "153.5mm";
  } else if (perf.includes("average")) {
    checkLeft = "187mm";
  }

  // Format details block
  const projectTitle = training.projectTitle || "";
  const projectGuide = training.projectGuide || "";
  const designation = training.designation || "";
  const division = training.division || "";
  
  let detailsHtml = "";
  if (projectTitle) {
    detailsHtml += `<strong>Project Title:</strong> ${escapeHtml(projectTitle)}<br/>`;
  }
  if (projectGuide) {
    detailsHtml += `<strong>Project Guide:</strong> ${escapeHtml(projectGuide)} ${designation ? `(${escapeHtml(designation)})` : ""}<br/>`;
  }
  if (division) {
    detailsHtml += `<strong>Division:</strong> ${escapeHtml(division)}<br/>`;
  }
  if (!detailsHtml) {
    detailsHtml = `Completed short-term practical training/project work successfully at IRDE, Dehradun.`;
  }

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
    font-family: Arial, Helvetica, sans-serif;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
  }
  .field {
    position: absolute;
    font-size: 14.5px;
    font-weight: bold;
    color: #1e3a8a;
  }
  .details-box {
    position: absolute;
    top: 166mm;
    left: 24mm;
    width: 162mm;
    height: 44mm;
    font-size: 13px;
    line-height: 1.6;
    color: #1e3a8a;
    padding: 8px 12px;
    overflow: hidden;
  }
</style>
</head>
<body>
  <!-- Certificate Number -->
  <div class="field" style="top: 36mm; right: 24mm; font-size: 12px;">
    Ref No: ${escapeHtml(student.referenceId)}
  </div>

  <!-- 1. Name of Student & Class -->
  <div class="field" style="top: 86.8mm; left: 74mm;">
    ${escapeHtml(studentNameClass)}
  </div>

  <!-- 2. Name of Institute -->
  <div class="field" style="top: 104.5mm; left: 74mm; max-width: 112mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
    ${escapeHtml(student.collegeName)}${student.collegeAddress ? `, ${escapeHtml(student.collegeAddress)}` : ""}
  </div>

  <!-- 3. Date of Commencement of Training -->
  <div class="field" style="top: 122.2mm; left: 102mm;">
    ${escapeHtml(fromDate)}
  </div>

  <!-- 4. Date of Completion of Training -->
  <div class="field" style="top: 140mm; left: 102mm;">
    ${escapeHtml(toDate)}
  </div>

  <!-- 5. Brief Details of Training Box -->
  <div class="details-box">
    ${detailsHtml}
  </div>

  <!-- 6. Overall Performance Checkmark -->
  <div class="field" style="top: 231.8mm; left: ${checkLeft}; font-size: 20px; color: #1e3a8a; font-family: 'Arial', sans-serif;">
    ✔
  </div>

  <!-- Dated -->
  <div class="field" style="top: 263.2mm; left: 58mm;">
    ${escapeHtml(completionDate)}
  </div>
</body>
</html>`;
}

module.exports = { certificateFileName, generateCertificateHtml };
