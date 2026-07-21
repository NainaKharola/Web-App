import { useEffect, useMemo, useState } from "react";
import {
  downloadCertificates,
  fetchCertificateStudents,
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

  const downloadCurrentCertificate = async () => {
    const id = batch.ids[batch.index];
    const student = students.find((item) => item._id === id);
    if (!student) return setBatch((current) => ({ ...current, index: current.index + 1 }));
    setDownloading(true);
    let succeeded = false;
    try {
      const { blob, filename } = await downloadCertificates([id], endpoint);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
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
          <h1>{bufferMode ? "Certificate1" : "Certificates"}</h1>
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
            Only students with Training Management marked Completed: Yes are
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
          <button
            className="admin-primary-btn"
            type="button"
            disabled={downloading || !selectedCount}
            onClick={handleDownload}
          >
            {downloading
              ? "Generating..."
              : `Download Certificates${selectedCount ? ` (${selectedCount})` : ""}`}
          </button>
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
              <button className="admin-primary-btn" type="button" disabled={downloading} onClick={downloadCurrentCertificate}>{downloading ? "Generating..." : "Download"}</button>
              <button className="admin-secondary-btn" type="button" disabled={downloading} onClick={() => { setBatch(null); setSelectedIds([]); }}>Cancel</button>
            </div>
          </section>
        </div> : null;
      })()}
    </main>
  );
}

export default Certificates;
