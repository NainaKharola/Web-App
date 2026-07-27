import { useEffect, useMemo, useState } from "react";
import { addCollege, deleteCollege, fetchAdminColleges, updateCollege } from "../services/adminService";
import "../styles/admin.css";

function CollegeManagement() {
  const [colleges, setColleges] = useState([]), [name, setName] = useState(""), [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null), [error, setError] = useState(""), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const loadColleges = async () => { setLoading(true); setError(""); try { setColleges(await fetchAdminColleges()); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { Promise.resolve().then(loadColleges); }, []);
  const visible = useMemo(() => { const term = search.trim().toLowerCase(); return term ? colleges.filter((college) => college.name.toLowerCase().includes(term)) : colleges; }, [colleges, search]);
  const submit = async (event) => { event.preventDefault(); setError(""); if (!name.trim()) return setError("College name is required."); setSaving(true); try { editing ? await updateCollege(editing.id, name) : await addCollege(name); setName(""); setEditing(null); await loadColleges(); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  const remove = async (college) => { if (!window.confirm(`Delete "${college.name}"?`)) return; try { await deleteCollege(college.id); await loadColleges(); } catch (err) { setError(err.message); } };
  return <main className="admin-console admin-shell">
    <header className="admin-topbar"><div><p className="portal-eyebrow">Admin Dashboard</p><h1>College Management</h1></div><button className="admin-secondary-btn" type="button" onClick={() => window.history.back()}>Back</button></header>
    <section className="admin-panel"><div className="admin-panel__header"><h2>{editing ? "Edit College" : "Add College"}</h2></div><form className="admin-actions-row" onSubmit={submit}><input className="admin-search" value={name} onChange={(event) => setName(event.target.value)} placeholder="College name" aria-label="College name" /><button className="admin-primary-btn" disabled={saving} type="submit">{saving ? "Saving..." : "Save"}</button>{editing && <button className="admin-secondary-btn" type="button" onClick={() => { setEditing(null); setName(""); }}>Cancel</button>}</form>{error && <p className="admin-error">{error}</p>}</section>
    <section className="admin-panel"><div className="admin-panel__header"><h2>College List</h2><input className="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search colleges" aria-label="Search colleges" /></div>{loading ? <div className="admin-loading">Loading colleges...</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Serial No.</th><th>College Name</th><th>Actions</th></tr></thead><tbody>{visible.length ? visible.map((college, index) => <tr key={college.id}><td>{index + 1}</td><td>{college.name}</td><td><button className="admin-secondary-btn" type="button" onClick={() => { setEditing(college); setName(college.name); }}>Edit</button>{" "}<button className="admin-danger-btn" type="button" onClick={() => remove(college)}>Delete</button></td></tr>) : <tr><td colSpan="3">No colleges found.</td></tr>}</tbody></table></div>}</section>
  </main>;
}

export default CollegeManagement;
