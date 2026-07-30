import { useEffect, useMemo, useState } from "react";
import {
  downloadCertificates,
  fetchCertificateStudents,
  removeCertificateBufferStudents,
} from "../services/adminService";
import "../styles/admin.css";

function Certificates({ bufferMode = false }) {
  const endpoint = bufferMode ? "certificate1" : "certificates";
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);

  useEffect(() => {
    let active = true;

    fetchCertificateStudents(date, endpoint)
      .then((response) => active && setStudents(response.students))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [date, endpoint]);

  const selectedCount = selectedIds.length;
  const allSelected = useMemo(
    () => students.length > 0 && selectedCount === students.length,
    [selectedCount, students.length],
  );

  const toggleStudent = (id, checked) => {
    setSelectedIds((current) => {
      return checked ? [...current, id] : current.filter((value) => value !== id);
    });
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : students.map((student) => student._id));
  };

  const goBack = () => {
    window.history.pushState({}, "", "/admin/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleDownload = () => {
    if (!selectedCount) {
      setError("Select one or more completed trainees.");
      return;
    }
    setError("");
    setBatch({ ids: [...selectedIds], index: 0, successfulIds: [] });
  };

  const removeSelected = async () => {
    if (!selectedCount) return setError("Select one or more students to remove.");
    if (!window.confirm("Remove the selected students from the certificate buffer?")) return;
    setDownloading(true);
    try {
      await removeCertificateBufferStudents(selectedIds);
      setStudents((current) => current.filter((student) => !selectedIds.includes(student._id)));
      setSelectedIds([]);
      setDeleteMode(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const printCurrentCertificate = async () => {
    const id = batch.ids[batch.index];
    const student = students.find((item) => item._id === id);
    if (!student) return setBatch((current) => ({ ...current, index: current.index + 1 }));
    setDownloading(true);
    let succeeded = false;
    try {
      const { blob } = await downloadCertificates([id], endpoint);
      const url = URL.createObjectURL(blob);
      let iframe = document.getElementById("certificate-print-iframe");
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "certificate-print-iframe";
        iframe.style.position = "absolute";
        iframe.style.width = "0px";
        iframe.style.height = "0px";
        iframe.style.border = "none";
        iframe.style.left = "-9999px";
        document.body.appendChild(iframe);
      }
      
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 5000);
      };
      iframe.src = url;
      succeeded = true;
    } catch (err) {
      setError(`Unable to generate certificate for ${student.name}.`);
    } finally {
      setDownloading(false);
      const nextIndex = batch.index + 1;
      if (nextIndex >= batch.ids.length) {
        setBatch(null);
        if (!bufferMode) {
          const completedIds = succeeded
            ? [...batch.successfulIds, id]
            : batch.successfulIds;
          setStudents((current) => current.filter((item) => !completedIds.includes(item._id)));
        }
        setSelectedIds([]);
      } else {
        setBatch((current) => ({ ...current, index: nextIndex, successfulIds: succeeded ? [...current.successfulIds, id] : current.successfulIds }));
      }
    }
  };

  return (
    <main className="admin-console admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="portal-eyebrow">Admin Panel</p>
          <h1>{bufferMode ? "Certificate Generate" : "Certificates"}</h1>
        </div>
        <button className="admin-secondary-btn" type="button" onClick={goBack}>
          Back to Dashboard
        </button>
      </header>

      <section className="admin-panel">
        <div className="admin-actions-row">
          <label className="admin-field certificate-date-filter">
            <span>Completion Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSelectedIds([]);
              }}
            />
          </label>
          <p className="admin-muted">
            Only students with Student Joining Details and Completion marked Completed: Yes are
            listed.
          </p>
          <label className="admin-field">
            <span>Search Student</span>
            <input
              type="text"
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {bufferMode && <button className="admin-danger-btn" type="button" disabled={downloading} onClick={() => { setDeleteMode((current) => !current); setSelectedIds([]); }}>{deleteMode ? "Cancel Delete" : "Delete Entry"}</button>}
          {bufferMode && deleteMode ? <button className="admin-danger-btn" type="button" disabled={downloading || !selectedCount} onClick={removeSelected}>Delete Selected</button> : <button
            className="admin-primary-btn"
            type="button"
            disabled={downloading || !selectedCount}
            onClick={handleDownload}
          >
            {downloading ? "Generating..." : `Print Certificates${selectedCount ? ` (${selectedCount})` : ""}`}
          </button>}
        </div>
        {error && <p className="admin-error">{error}</p>}
        {loading ? (
          <div className="admin-loading">Loading completed trainees...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table certificates-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      title="Select all listed students."
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Serial No.</th>
                  <th>Reference ID</th>
                  <th>Student Name</th>
                  <th>College Name</th>
                  <th>Course</th>
                  <th>Branch</th>
                  <th>Training Duration</th>
                  <th>From Date</th>
                  <th>To Date</th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter((student) =>
                    (student.name || "")
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((student, index) => {
                    const training = student.trainingManagement || {};
                    return (
                      <tr key={student._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student._id)}
                            onChange={(event) =>
                              toggleStudent(student._id, event.target.checked)
                            }
                            aria-label={`Select ${student.name}`}
                          />
                        </td>
                        <td>{index + 1}</td>
                        <td>{student.referenceId || "-"}</td>
                        <td>{student.name}</td>
                        <td>{training.collegeName || student.collegeName}</td>
                        <td>{training.courseName || student.course}</td>
                        <td>{training.branch || student.branch}</td>
                        <td>
                          {training.trainingDuration ||
                            student.internshipDuration ||
                            "-"}
                        </td>
                        <td>{training.fromDate || "-"}</td>
                        <td>{training.toDate || "-"}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {!students.filter((student) =>
              (student.name || "").toLowerCase().includes(search.toLowerCase()),
            ).length && (
              <div className="admin-empty-state">
                {search
                  ? "No student found."
                  : date
                    ? "No students completed training on this date."
                    : "No completed trainees are available for certificates."}
              </div>
            )}
          </div>
        )}
      </section>
      {batch && batch.index < batch.ids.length && (() => {
        const student = students.find((item) => item._id === batch.ids[batch.index]);
        return student ? <div className="certificate-modal-backdrop" role="dialog" aria-modal="true" aria-label="Certificate Ready">
          <section className="certificate-modal">
            <h2>Certificate Ready</h2>
            <p>Student: <strong>{student.name}</strong></p>
            <div className="admin-actions-row">
              <button className="admin-primary-btn" type="button" disabled={downloading} onClick={printCurrentCertificate}>{downloading ? "Generating..." : "Print Certificate"}</button>
              <button className="admin-secondary-btn" type="button" disabled={downloading} onClick={() => { setBatch(null); setSelectedIds([]); }}>Cancel</button>
            </div>
          </section>
        </div> : null;
      })()}
    </main>
  );
}

export default Certificates;
