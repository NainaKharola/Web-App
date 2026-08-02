import { useEffect, useMemo, useState } from "react";
import { fetchAdministration, fetchAdminStudents } from "../services/adminService";
import "../styles/admin.css";

const REPORT_COLUMNS = [
  ["serial", "S.No."], ["name", "Name"], ["course", "Course"], ["branch", "Branch"], ["year", "Year"],
  ["college", "College"], ["location", "College Location"], ["joinedDate", "Joined Date"], ["endDate", "End Date"],
  ["duration", "Duration"], ["projectTitle", "Project Title"], ["projectGuide", "Project Guide"], ["designation", "Designation"],
];

const escapeHtml = (value) => String(value ?? "-").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN");
}

function dateValue(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function reportValue(student, key, index) {
  const training = student.trainingManagement || {};
  const values = {
    serial: index + 1, name: student.name, course: training.courseName || student.course,
    branch: training.branch || student.branch, year: training.courseYear || student.year,
    college: training.collegeName || student.collegeName, location: training.collegeLocation || student.location,
    joinedDate: formatDate(training.joinedDate), endDate: formatDate(training.toDate),
    duration: training.trainingDuration || student.internshipDuration, projectTitle: training.projectTitle,
    projectGuide: training.projectGuide, designation: training.designation,
  };
  return values[key] || "-";
}

function Reports() {
  const [students, setStudents] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ fromDate: "", toDate: "", status: "", division: "" });
  const [selectedFields, setSelectedFields] = useState([]);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchAdminStudents(), fetchAdministration()])
      .then(([studentResponse, administrationResponse]) => {
        if (!active) return;
        setStudents(studentResponse.students || []);
        setDivisions(administrationResponse.administration?.divisions || []);
      })
      .catch((requestError) => active && setError(requestError.message || "Unable to load report data."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => {
    if (!filters.status) return [];
    return students.filter((student) => {
      const training = student.trainingManagement || {};
      const statusMatch = filters.status === "Approved" ? student.status === "Approved" : filters.status === "Joined" ? training.joined === "Yes" : training.completed === "Yes";
      if (!statusMatch || (filters.division && training.division !== filters.division)) return false;
      const relevantDate = filters.status === "Approved" ? student.approvedDate : filters.status === "Joined" ? training.joinedDate : training.completionDate;
      const normalizedDate = dateValue(relevantDate);
      return (!filters.fromDate || (normalizedDate && normalizedDate >= filters.fromDate)) && (!filters.toDate || (normalizedDate && normalizedDate <= filters.toDate));
    });
  }, [filters, students]);

  const visibleColumns = selectedFields.length ? REPORT_COLUMNS.filter(([key]) => selectedFields.includes(key)) : REPORT_COLUMNS;
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const toggleField = (key) => setSelectedFields((current) => {
    const selection = current.length ? current : REPORT_COLUMNS.map(([columnKey]) => columnKey);
    return selection.includes(key) ? selection.filter((value) => value !== key) : [...selection, key];
  });

  const reportHtml = () => `<!doctype html><html><head><meta charset="utf-8"><title>DRDO Internship Report</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#102a43}h1{margin:0 0 8px}p{color:#486581}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #bcccdc;padding:7px;text-align:left;vertical-align:top}th{background:#eaf2fb}@media print{body{padding:0}}</style></head><body><h1>DRDO Internship Report</h1><p>Status: ${escapeHtml(filters.status)}${filters.division ? ` | Division: ${escapeHtml(filters.division)}` : ""} | Students: ${rows.length}</p><table><thead><tr>${visibleColumns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead><tbody>${rows.map((student, index) => `<tr>${visibleColumns.map(([key]) => `<td>${escapeHtml(reportValue(student, key, index))}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;

  const exportExcel = () => {
    const csv = [visibleColumns.map(([, label]) => `"${label.replace(/"/g, '""')}"`).join(","), ...rows.map((student, index) => visibleColumns.map(([key]) => `"${String(reportValue(student, key, index)).replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    link.download = "DRDO-Internship-Report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const reportPdf = () => {
    const pdfText = (value) => String(value ?? "-").replace(/[^\x20-\x7e]/g, "?").replace(/([\\\\()])/g, "\\\\$1");
    const lines = [
      "DRDO Internship Report",
      `Status: ${filters.status}${filters.division ? ` | Division: ${filters.division}` : ""} | Students: ${rows.length}`,
      "",
      visibleColumns.map(([, label]) => label).join(" | "),
      ...rows.flatMap((student, index) => [visibleColumns.map(([key]) => reportValue(student, key, index)).join(" | ")]),
    ];
    const pageLines = 46;
    const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / pageLines)) }, (_, index) => lines.slice(index * pageLines, (index + 1) * pageLines));
    const objects = ["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`];

    pages.forEach((page, index) => {
      const content = ["BT", "/F1 8 Tf", "40 800 Td", ...page.flatMap((line, lineIndex) => [`(${pdfText(line)}) Tj`, lineIndex === page.length - 1 ? "" : "0 -16 Td"]), "ET"].filter(Boolean).join("\n");
      const pageObject = 3 + index * 2;
      const contentObject = pageObject + 1;
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 842] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObject} 0 R >>`);
      objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    });
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: "application/pdf" });
  };

  const downloadPdf = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(reportPdf());
    link.download = "DRDO-Internship-Report.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const printHtmlReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return setError("Allow pop-ups to print the report.");
    printWindow.document.write(reportHtml());
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const printPdf = () => {
    const pdfUrl = URL.createObjectURL(reportPdf());
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      URL.revokeObjectURL(pdfUrl);
      return setError("Allow pop-ups to print the PDF report.");
    }
    printWindow.document.write(`<!doctype html><html><head><title>DRDO Internship Report</title><style>html,body,iframe{width:100%;height:100%;margin:0;border:0}</style></head><body><iframe title="DRDO Internship Report" src="${pdfUrl}"></iframe></body></html>`);
    printWindow.document.close();

    const frame = printWindow.document.querySelector("iframe");
    frame.addEventListener("load", () => {
      window.setTimeout(() => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      }, 150);
    }, { once: true });
    printWindow.addEventListener("beforeunload", () => URL.revokeObjectURL(pdfUrl), { once: true });
  };

  const handleExport = (format) => {
    const action = exportOpen;
    setExportOpen(null);
    if (action === "download") {
      if (format === "Excel") exportExcel();
      else downloadPdf();
      return;
    }
    if (format === "PDF") printPdf();
    else printHtmlReport();
  };
  const checkedFields = selectedFields.length ? selectedFields : REPORT_COLUMNS.map(([key]) => key);

  return <main className="admin-console admin-shell reports-page">
    <header className="admin-topbar"><div><p className="portal-eyebrow">Admin Panel</p><h1>View Reports</h1></div><button className="admin-secondary-btn" type="button" onClick={() => window.history.back()}>Back to Dashboard</button></header>
    <section className="admin-panel">
      <div className="reports-filter-row">
        <label className="admin-field"><span>From Date</span><input type="date" value={filters.fromDate} onChange={(event) => updateFilter("fromDate", event.target.value)} /></label>
        <label className="admin-field"><span>To Date</span><input type="date" value={filters.toDate} onChange={(event) => updateFilter("toDate", event.target.value)} /></label>
        <label className="admin-field"><span>Status</span><select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><option value="">Select Status</option><option>Approved</option><option>Joined</option><option>Completed</option></select></label>
        <label className="admin-field"><span>Division</span><select value={filters.division} onChange={(event) => updateFilter("division", event.target.value)}><option value="">All Divisions</option>{divisions.map((division) => <option key={division} value={division}>{division}</option>)}</select></label>
        <label className="admin-field"><span>Number of Students</span><input readOnly value={rows.length} aria-label="Number of Students" /></label>
      </div>
      <div className="admin-actions-row"><button className="admin-secondary-btn" type="button" onClick={() => setFieldsOpen(true)}>Select Fields</button></div>
      {error && <p className="admin-error">{error}</p>}
      {loading ? <div className="admin-loading">Loading report data...</div> : <div className="admin-table-wrap"><table className="admin-table reports-table"><thead><tr>{visibleColumns.map(([key, label]) => <th key={key}>{label}</th>)}</tr></thead><tbody>{rows.map((student, index) => <tr key={student._id}>{visibleColumns.map(([key]) => <td key={key}>{reportValue(student, key, index)}</td>)}</tr>)}</tbody></table>{!rows.length && <div className="admin-empty-state">{filters.status ? "No students match the selected report filters." : "Select a status to view the report."}</div>}</div>}
      <div className="reports-export-actions"><button className="admin-primary-btn" type="button" disabled={!rows.length} onClick={() => setExportOpen("download")}>Download</button><button className="admin-secondary-btn" type="button" disabled={!rows.length} onClick={() => setExportOpen("print")}>Print</button></div>
    </section>
    {fieldsOpen && <div className="reports-dialog-backdrop" role="presentation"><section className="reports-dialog" role="dialog" aria-modal="true" aria-label="Select report fields"><h2>Select Fields</h2><div className="reports-field-list">{REPORT_COLUMNS.map(([key, label]) => <label key={key}><input type="checkbox" checked={checkedFields.includes(key)} onChange={() => toggleField(key)} /> {label}</label>)}</div><div className="reports-dialog-actions"><button className="admin-secondary-btn" type="button" onClick={() => setSelectedFields([])}>Show All Fields</button><button className="admin-primary-btn" type="button" onClick={() => setFieldsOpen(false)}>Done</button></div></section></div>}
    {exportOpen && <div className="reports-dialog-backdrop" role="presentation"><section className="reports-dialog reports-dialog--small" role="dialog" aria-modal="true" aria-label={`${exportOpen === "download" ? "Download" : "Print"} report`}><h2>{exportOpen === "download" ? "Download Report" : "Print Report"}</h2><p>Select a format.</p><div className="reports-dialog-actions"><button className="admin-primary-btn" type="button" onClick={() => handleExport("PDF")}>PDF</button><button className="admin-secondary-btn" type="button" onClick={() => handleExport("Excel")}>Excel</button><button className="admin-secondary-btn" type="button" onClick={() => setExportOpen(null)}>Cancel</button></div></section></div>}
  </main>;
}

export default Reports;
