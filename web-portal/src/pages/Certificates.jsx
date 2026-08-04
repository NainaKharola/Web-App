import { useEffect, useMemo, useState } from "react";
import { downloadCertificates, fetchCertificateStudents } from "../services/adminService";
import "../styles/admin.css";

const CERTIFICATE_DOWNLOADS_KEY = "drdoCertificateDownloadedStudentIds";

function savedCertificateDownloadIds() {
  try {
    const value = JSON.parse(localStorage.getItem(CERTIFICATE_DOWNLOADS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function Certificates({ bufferMode = false }) {
  const endpoint = bufferMode ? "certificate1" : "certificates";
  const [students, setStudents] = useState([]), [selectedIds, setSelectedIds] = useState([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(""), [search, setSearch] = useState(""), [batch, setBatch] = useState(null), [preview, setPreview] = useState(null), [downloadedIds, setDownloadedIds] = useState(savedCertificateDownloadIds);

  useEffect(() => { let active = true; fetchCertificateStudents("", endpoint).then((response) => active && setStudents(response.students)).catch((err) => active && setError(err.message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [endpoint]);
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url); }, [preview]);

  const visibleStudents = useMemo(() => { const term = search.trim().toLowerCase(); return term ? students.filter((student) => [student.name, student.referenceId, student.collegeName, student.branch, student.course].some((value) => String(value || "").toLowerCase().includes(term))) : students; }, [search, students]);
  const allSelected = visibleStudents.length > 0 && visibleStudents.every((student) => selectedIds.includes(student._id));
  const toggle = (id, checked) => setSelectedIds((current) => checked ? [...new Set([...current, id])] : current.filter((value) => value !== id));
  const toggleAll = () => setSelectedIds((current) => allSelected ? current.filter((id) => !visibleStudents.some((student) => student._id === id)) : [...new Set([...current, ...visibleStudents.map((student) => student._id)])]);
  const back = () => { window.history.pushState({}, "", "/admin/approved-students"); window.dispatchEvent(new PopStateEvent("popstate")); };
  const start = () => { if (!selectedIds.length) return setError("Select at least one approved student."); setError(""); setBatch({ ids: [...selectedIds], index: 0 }); };
  const currentStudent = batch && students.find((student) => student._id === batch.ids[batch.index]);
  const prepare = async () => {
    if (!currentStudent) return; setBusy(true); setError("");
    try { const { blob, filename } = await downloadCertificates([currentStudent._id], endpoint); setPreview({ url: URL.createObjectURL(blob), filename }); }
    catch (err) { setError(`Unable to generate certificate for ${currentStudent.name}.`); }
    finally { setBusy(false); }
  };
  const download = () => {
    if (!preview) return;
    const link = document.createElement("a");
    link.href = preview.url;
    const refId = currentStudent.referenceId || "UNKNOWN";
    const nameNoSpaces = (currentStudent.name || "Student").replace(/\s+/g, "");
    link.download = `Certificate_${refId}_${nameNoSpaces}.pdf`;
    link.click();
    setDownloadedIds((current) => {
      const next = [...new Set([...current, currentStudent._id])];
      localStorage.setItem(CERTIFICATE_DOWNLOADS_KEY, JSON.stringify(next));
      return next;
    });
  };
  const print = () => { const frame = document.getElementById("certificate-preview-frame"); frame?.contentWindow?.print(); };
  const next = () => { if (!batch) return; if (preview?.url) URL.revokeObjectURL(preview.url); setPreview(null); if (batch.index + 1 >= batch.ids.length) { setBatch(null); setSelectedIds([]); } else setBatch((current) => ({ ...current, index: current.index + 1 })); };

  return <main className="admin-console admin-shell">
    <header className="admin-topbar"><div><p className="portal-eyebrow">Admin Panel</p><h1>Generate Certificate</h1></div><button className="admin-secondary-btn" type="button" onClick={back}>Back to Dashboard</button></header>
    <section className="admin-panel"><div className="admin-actions-row"><label className="admin-field"><span>Search Approved Students</span><input type="search" placeholder="Name, reference ID, college, branch, or course" value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="admin-primary-btn" type="button" disabled={!selectedIds.length} onClick={start}>Generate Certificate{selectedIds.length ? ` (${selectedIds.length})` : ""}</button></div><p className="admin-muted">Select approved students to generate one certificate for each student.</p>{error && <p className="admin-error">{error}</p>}
      {loading ? <div className="admin-loading">Loading approved students...</div> : <div className="admin-table-wrap"><table className="admin-table certificates-table"><thead><tr><th><input type="checkbox" checked={allSelected} onChange={toggleAll} title="Select all listed students" /></th><th>Reference ID</th><th>Student Name</th><th>College Name</th><th>Course</th><th>Branch</th><th>Certificate Status</th></tr></thead><tbody>{visibleStudents.map((student) => <tr key={student._id} className={downloadedIds.includes(student._id) ? "certificate-downloaded-row" : ""}><td><input type="checkbox" checked={selectedIds.includes(student._id)} onChange={(event) => toggle(student._id, event.target.checked)} aria-label={`Select ${student.name}`} /></td><td>{student.referenceId || "-"}</td><td>{student.name}</td><td>{student.trainingManagement?.collegeName || student.collegeName || "-"}</td><td>{student.trainingManagement?.courseName || student.course || "-"}</td><td>{student.trainingManagement?.branch || student.branch || "-"}</td><td>{downloadedIds.includes(student._id) ? "Certificate Downloaded" : "-"}</td></tr>)}</tbody></table>{!visibleStudents.length && <div className="admin-empty-state">No approved students found.</div>}</div>}
    </section>
    {currentStudent && <div className="certificate-modal-backdrop" role="dialog" aria-modal="true" aria-label="Certificate workflow"><section className="certificate-modal certificate-modal--wide"><h2>Certificate {batch.index + 1} of {batch.ids.length}</h2><p>Student: <strong>{currentStudent.name}</strong></p>{preview ? <iframe id="certificate-preview-frame" title={`Certificate preview for ${currentStudent.name}`} src={preview.url} className="certificate-preview-frame" /> : <p className="admin-muted">Prepare this certificate to preview, print, or download it.</p>}<div className="admin-actions-row">{!preview ? <button className="admin-primary-btn" type="button" disabled={busy} onClick={prepare}>{busy ? "Generating..." : "Preview Certificate"}</button> : <><button className="admin-secondary-btn" type="button" onClick={print}>Print</button><button className="admin-primary-btn" type="button" onClick={download}>Download</button><button className="admin-secondary-btn" type="button" onClick={next}>{batch.index + 1 === batch.ids.length ? "Finish" : "Next Certificate"}</button></>}<button className="admin-secondary-btn" type="button" disabled={busy} onClick={() => { if (preview?.url) URL.revokeObjectURL(preview.url); setPreview(null); setBatch(null); }}>Cancel</button></div></section></div>}
  </main>;
}
export default Certificates;
