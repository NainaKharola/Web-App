import { useEffect, useState } from "react";
import { createGyapanPreview, fetchGyapanStudents } from "../services/gyapanService";
import "../styles/admin.css";

function GyapanPage() {
  const [date, setDate] = useState("");
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const back = () => {
    window.history.pushState({}, "", "/admin/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const loadStudents = async (trainingStartDate = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchGyapanStudents(trainingStartDate);
      setStudents(response.students);
      setSelected([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    fetchGyapanStudents()
      .then((response) => {
        if (active) setStudents(response.students);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const toggle = (id, checked) => setSelected((current) => (
    checked ? [...current, id] : current.filter((value) => value !== id)
  ));

  const generate = async () => {
    if (!selected.length) return setError("Select at least one student.");
    setBusy(true);
    setError("");
    try {
      const response = await createGyapanPreview({ ids: selected });
      window.history.pushState({}, "", `/admin/gyapan/${response.gyapan._id}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-console admin-shell">
      <header className="admin-topbar">
        <div><p className="portal-eyebrow">Admin Panel</p><h1>GYAPAN</h1></div>
        <button className="admin-secondary-btn" type="button" onClick={back}>Back to Dashboard</button>
      </header>
      <section className="admin-panel">
        <div className="admin-actions-row">
          <label className="admin-field certificate-date-filter">
            <span>Completion Date (Optional)</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <button className="admin-primary-btn" type="button" onClick={() => loadStudents(date)} disabled={loading}>
            {loading ? "Loading..." : "Apply Filter"}
          </button>
        </div>
        {error && <p className="admin-error">{error}</p>}
        {students.length > 0 && <>
          <div className="admin-actions-row">
            <label><input type="checkbox" checked={selected.length === students.length} onChange={(event) => setSelected(event.target.checked ? students.map((student) => student._id) : [])} /> Select All</label>
            <span className="admin-muted">{selected.length} selected</span>
          </div>
          <div className="gyapan-cards">
            {students.map((student) => {
              const training = student.trainingManagement || {};
              return <article className="gyapan-card" key={student._id}>
                <label><input type="checkbox" checked={selected.includes(student._id)} onChange={(event) => toggle(student._id, event.target.checked)} /> {training.studentName || student.name}</label>
                <p>{training.courseName || student.course} · {training.courseYear || student.year}</p>
                <p>{training.branch || student.branch}</p>
                <p>{training.collegeName || student.collegeName}</p>
                <p>{training.collegeLocation || student.location}</p>
                <p>Training: {training.fromDate || "-"} to {training.toDate || "-"}</p>
              </article>;
            })}
          </div>
          <div className="admin-actions-row admin-actions-row--spaced">
            <button className="admin-primary-btn" type="button" disabled={busy} onClick={generate}>{busy ? "Creating Preview..." : "Generate Gyapan"}</button>
          </div>
        </>}
        {!loading && students.length === 0 && !error && <div className="admin-empty-state">{date ? "No completed students have this completion date." : "No students with Completed status set to Yes are available."}</div>}
      </section>
    </main>
  );
}

export default GyapanPage;
