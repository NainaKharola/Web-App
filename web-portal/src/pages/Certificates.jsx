import { useEffect, useMemo, useState } from "react";
import {
  downloadCertificates,
  fetchCertificateStudents,
} from "../services/adminService";
import "../styles/admin.css";

function Certificates() {
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    fetchCertificateStudents(date)
      .then((response) => active && setStudents(response.students))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [date]);

  const selectedCount = selectedIds.length;
  const allSelected = useMemo(
    () => students.length > 0 && selectedCount === students.length,
    [selectedCount, students.length],
  );

  const toggleStudent = (id, checked) => {
    setSelectedIds(checked ? [id] : []);
  };

  const toggleAll = () => {
    // Multiple selection disabled
  };

  const goBack = () => {
    window.history.pushState({}, "", "/admin/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleDownload = async () => {
    if (!selectedCount) {
      setError("Select one or more completed trainees.");
      return;
    }

    setDownloading(true);
    setError("");

    try {
      for (const id of selectedIds) {
        const { blob, filename } = await downloadCertificates([id]);

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        // Small delay so browsers don't block multiple downloads
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="admin-console admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="portal-eyebrow">Admin Panel</p>
          <h1>Certificates</h1>
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
                      disabled
                      title="Only one certificate can be generated at a time."
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
    </main>
  );
}

export default Certificates;
