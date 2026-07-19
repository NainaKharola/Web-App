const fs = require("fs/promises");
const path = require("path");

const templatePath = path.join(__dirname, "..", "templates", "gyapan.html");

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatDate(value) {
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";
}

function parseDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(Date.UTC(...match.slice(1).map(Number).map((part, index) => index === 1 ? part - 1 : part)));
  return date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() === Number(match[2]) - 1 &&
    date.getUTCDate() === Number(match[3])
    ? date
    : null;
}

function trainingDuration(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end || end < start) return "";

  const days = (end - start) / (24 * 60 * 60 * 1000);
  if (days && days % 7 === 0) {
    const weeks = days / 7;
    return `${weeks} Week${weeks === 1 ? "" : "s"}`;
  }
  return `${days} Day${days === 1 ? "" : "s"}`;
}

function studentToRow(student) {
  const training = student.trainingManagement || {};
  return {
    studentId: student._id,
    studentName: training.studentName || student.name || "",
    course: training.courseName || training.course || student.course || "",
    courseYear: training.courseYear || student.year || "",
    branch: training.branch || training.department || student.branch || student.department || "",
    collegeName: training.collegeName || student.collegeName || "",
    collegeLocation: training.collegeLocation || student.location || "",
    trainingStartDate: training.fromDate || "",
    trainingEndDate: training.toDate || "",
  };
}

function buildStudentRows(rows) {
    return rows
    .map((row) => {
      const duration = trainingDuration(
        row.trainingStartDate,
        row.trainingEndDate,
      );
      return `
        <tr>
          <td>
            <strong>${escapeHtml(row.studentName)}</strong>,
            ${escapeHtml(row.course)}
            ${escapeHtml(row.courseYear)},
            ${escapeHtml(row.branch)}
          </td>

          <td>
            ${escapeHtml(row.collegeName)}
          </td>

          <td>
            ${escapeHtml(row.collegeLocation)}
            <br>
            ${escapeHtml(formatDate(row.trainingStartDate))}
            &nbsp;&nbsp;&nbsp;&nbsp;
            ${escapeHtml(formatDate(row.trainingEndDate))}
            ${duration ? `<br>${escapeHtml(duration)}` : ""}
          </td>
        </tr>
      `;
    })
    .join("");
}

async function generateGyapanHtml({ rows, letterNumber, issueDate }) {
  const template = await fs.readFile(templatePath, "utf8");
  return template.replace(/{{(studentRows|letterNumber|issueDate)}}/g, (_, key) => {
    if (key === "studentRows") return buildStudentRows(rows);
    return escapeHtml(key === "issueDate" ? formatDate(issueDate) : letterNumber);
  });
}

module.exports = { generateGyapanHtml, studentToRow };
