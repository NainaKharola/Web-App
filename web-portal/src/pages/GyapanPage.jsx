import { useEffect, useState } from "react";
import { createGyapanPreview, fetchGyapanStudents, removeGyapanBufferStudents } from "../services/gyapanService";
import "../styles/admin.css";

function GyapanPage({ bufferMode = false }) {
  const module = bufferMode ? "gyapan1" : "gyapan";
  const [date, setDate] = useState("");
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [groupingData, setGroupingData] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printingStatus, setPrintingStatus] = useState("");

  const back = () => {
    window.history.pushState({}, "", "/admin/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const loadStudents = async (trainingStartDate = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchGyapanStudents(trainingStartDate, module, search);
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

    fetchGyapanStudents("", module)
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
  }, [module]);

  const toggle = (id, checked) => setSelected((current) => (
    checked ? [...current, id] : current.filter((value) => value !== id)
  ));

  const generateSingleGroup = async (ids) => {
    setBusy(true);
    setError("");
    try {
      const response = await createGyapanPreview({ ids }, module);
      window.history.pushState({}, "", `/admin/${module}/${response.gyapan._id}?print=true`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const loadAndPrintIframe = (html) => {
    return new Promise((resolve) => {
      let iframe = document.getElementById("gyapan-printing-iframe");
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "gyapan-printing-iframe";
        iframe.style.position = "absolute";
        iframe.style.width = "0px";
        iframe.style.height = "0px";
        iframe.style.border = "none";
        iframe.style.left = "-9999px";
        document.body.appendChild(iframe);
      }

      const onFrameLoad = () => {
        iframe.removeEventListener("load", onFrameLoad);
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        resolve();
      };

      iframe.addEventListener("load", onFrameLoad);
      iframe.srcdoc = html;
    });
  };

  const handleGenerateAndPrint = async () => {
    if (!groupingData) return;
    const divisions = Object.keys(groupingData.groups);
    if (divisions.length === 0) return;

    if (divisions.length === 1) {
      const div = divisions[0];
      const ids = groupingData.groups[div];
      setGroupingData(null);
      generateSingleGroup(ids);
      return;
    }

    setIsPrinting(true);
    setError("");
    try {
      for (let i = 0; i < divisions.length; i++) {
        const div = divisions[i];
        const ids = groupingData.groups[div];
        setPrintingStatus(`Generating preview for ${div} (${i + 1}/${divisions.length})...`);
        const response = await createGyapanPreview({ ids }, module);
        
        setPrintingStatus(`Opening print dialog for ${div} (${i + 1}/${divisions.length})...`);
        await loadAndPrintIframe(response.html);
        
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setGroupingData(null);
    } catch (err) {
      setError(err.message || "An error occurred during print flow.");
    } finally {
      setIsPrinting(false);
      setPrintingStatus("");
    }
  };

  const generate = () => {
    setError("");
    if (!selected.length) return setError("Select at least one student.");

    const groups = {};
    const invalid = [];

    selected.forEach((id) => {
      const student = students.find((s) => s._id === id);
      if (!student) return;
      const division = student.trainingManagement?.division?.trim();
      if (!division) {
        invalid.push(student.trainingManagement?.studentName || student.name || "Unknown");
      } else {
        if (!groups[division]) {
          groups[division] = [];
        }
        groups[division].push(id);
      }
    });

    const divisionNames = Object.keys(groups);

    if (divisionNames.length === 0) {
      setGroupingData({ groups, invalid });
      return;
    }

    if (divisionNames.length === 1 && invalid.length === 0) {
      generateSingleGroup(groups[divisionNames[0]]);
      return;
    }

    setGroupingData({ groups, invalid });
  };

  const removeSelected = async () => {
    if (!selected.length) return setError("Select one or more students to remove.");
    if (!window.confirm("Remove the selected students from the Joining ISM buffer?")) return;
    setBusy(true);
    setError("");
    try {
      await removeGyapanBufferStudents(selected);
      setStudents((current) => current.filter((student) => !selected.includes(student._id)));
      setSelected([]);
      setDeleteMode(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-console admin-shell">
      <header className="admin-topbar">
        <div><p className="portal-eyebrow">Admin Panel</p><h1>{bufferMode ? "Joining ISM Generate" : "Joining ISM"}</h1></div>
        <button className="admin-secondary-btn" type="button" onClick={back}>Back to Dashboard</button>
      </header>
      <section className="admin-panel">
        <div className="admin-actions-row">
          <label className="admin-field certificate-date-filter">
            <span>Joining Date (Optional)</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="admin-field"><span>Search Student</span><input type="text" placeholder="Search by student name..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
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
            {bufferMode && <button className="admin-danger-btn" type="button" disabled={busy} onClick={() => { setDeleteMode((current) => !current); setSelected([]); }}>{deleteMode ? "Cancel Delete" : "Delete Entry"}</button>}
            {bufferMode && deleteMode
              ? <button className="admin-danger-btn" type="button" disabled={busy || !selected.length} onClick={removeSelected}>Delete Selected</button>
              : <button className="admin-primary-btn" type="button" disabled={busy} onClick={generate}>{busy ? "Creating Preview..." : "Generate Joining ISM"}</button>}
          </div>
        </>}
        {!loading && students.length === 0 && !error && <div className="admin-empty-state">{date ? "No joined students have this joining date." : "No students with Joined status set to Yes are available."}</div>}
      </section>

      {groupingData && (
        <div className="administration-dialog-backdrop" role="presentation">
          <div className="administration-dialog" style={{ maxWidth: "500px" }}>
            <h2>Generate ISM Documents</h2>
            
            {groupingData.invalid && groupingData.invalid.length > 0 && (
              <div className="admin-error" style={{ marginBottom: "16px", padding: "12px", borderRadius: "6px", textAlign: "left" }}>
                <strong>The following students do not have an allocated division and cannot be included in ISM generation:</strong>
                <ul style={{ marginTop: "6px", paddingLeft: "20px", margin: "6px 0 0 0" }}>
                  {groupingData.invalid.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ul>
              </div>
            )}

            {Object.keys(groupingData.groups).length > 0 ? (
              <>
                <p style={{ marginBottom: "12px", textAlign: "left" }}>
                  {Object.keys(groupingData.groups).length === 1 
                    ? "The selected student(s) will be generated for the following division:"
                    : "The selected students belong to multiple divisions. The following ISMs will be generated:"}
                </p>
                <div style={{ background: "#f5f8fb", padding: "14px", borderRadius: "8px", border: "1px solid #dbe7f4", marginBottom: "20px", textAlign: "left" }}>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                    {Object.entries(groupingData.groups).map(([div, ids]) => (
                      <li key={div} style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
                        <span style={{ color: "#17633f" }}>✓</span> {div} ({ids.length} Student{ids.length === 1 ? "" : "s"})
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p style={{ color: "var(--muted)", marginBottom: "20px" }}>No valid students left for ISM generation.</p>
            )}

            {isPrinting && (
              <div className="administration-loading" style={{ margin: "16px 0", justifyContent: "center", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="administration-spinner" /> {printingStatus}
              </div>
            )}

            <div className="administration-dialog__actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                className="admin-secondary-btn" 
                type="button" 
                disabled={isPrinting}
                onClick={() => setGroupingData(null)}
              >
                Cancel
              </button>
              {Object.keys(groupingData.groups).length > 0 && (
                <button 
                  className="admin-primary-btn" 
                  type="button" 
                  disabled={isPrinting}
                  onClick={handleGenerateAndPrint}
                >
                  {isPrinting ? "Printing..." : "Generate & Print"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default GyapanPage;
