import { useEffect, useMemo, useState } from "react";
import { addCollege, addManagementItem, deleteCollege, deleteManagementItem, fetchAdminColleges, fetchManagementItems, updateCollege, updateManagementItem } from "../services/adminService";
import { compareDurations } from "../utils/durationSort";
import "../styles/admin.css";

const sections = [
  { key: "colleges", singular: "College", list: fetchAdminColleges, add: (_, name) => addCollege(name), update: (_, id, name) => updateCollege(id, name), remove: (_, id) => deleteCollege(id) },
  { key: "courses", singular: "Course", list: fetchManagementItems, add: addManagementItem, update: updateManagementItem, remove: deleteManagementItem },
  { key: "branches", singular: "Branch", list: fetchManagementItems, add: addManagementItem, update: updateManagementItem, remove: deleteManagementItem },
  { key: "durations", singular: "Duration", list: fetchManagementItems, add: addManagementItem, update: updateManagementItem, remove: deleteManagementItem },
];

function ManagementSection({ config, initiallyOpen = true }) {
  const [items, setItems] = useState([]), [name, setName] = useState(""), [search, setSearch] = useState(""), [editing, setEditing] = useState(null), [open, setOpen] = useState(initiallyOpen), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState("");
  const load = async () => { setLoading(true); try { setItems(await config.list(config.key)); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { Promise.resolve().then(load); }, []);
  const visible = useMemo(() => { const term = search.trim().toLowerCase(); return (term ? items.filter((item) => item.name.toLowerCase().includes(term)) : items).sort((a, b) => config.key === "durations" ? compareDurations(a.name, b.name) : a.name.localeCompare(b.name)); }, [config.key, items, search]);
  const submit = async (event) => { event.preventDefault(); if (!name.trim()) return setError(`${config.singular} name is required.`); setSaving(true); setError(""); try { editing ? await config.update(config.key, editing.id, name) : await config.add(config.key, name); setName(""); setEditing(null); await load(); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  const remove = async (item) => { if (!window.confirm(`Delete "${item.name}"?`)) return; try { await config.remove(config.key, item.id); await load(); } catch (err) { setError(err.message); } };
  const listLabel = `${config.singular} List`;
  return <section className="admin-panel">
    <div className="admin-panel__header"><button className="admin-secondary-btn" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? "▲" : "▼"} {listLabel}</button></div>
    {open && <><div className="admin-panel__header"><h2>{editing ? `Edit ${config.singular}` : `Add ${config.singular}`}</h2></div><form className="admin-actions-row" onSubmit={submit}><input className="admin-search" value={name} onChange={(event) => setName(event.target.value)} placeholder={`${config.singular} name`} aria-label={`${config.singular} name`} /><button className="admin-primary-btn" disabled={saving} type="submit">{saving ? "Saving..." : editing ? `Save ${config.singular}` : `Add ${config.singular}`}</button>{editing && <button className="admin-secondary-btn" type="button" onClick={() => { setEditing(null); setName(""); }}>Cancel</button>}</form>{error && <p className="admin-error">{error}</p>}<input className="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${config.key}`} aria-label={`Search ${config.key}`} />{loading ? <div className="admin-loading">Loading {config.key}...</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Serial No.</th><th>{config.singular} Name</th><th>Actions</th></tr></thead><tbody>{visible.length ? visible.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.name}</td><td><button className="admin-secondary-btn" type="button" onClick={() => { setEditing(item); setName(item.name); }}>Edit</button>{" "}<button className="admin-danger-btn" type="button" onClick={() => remove(item)}>Delete</button></td></tr>) : <tr><td colSpan="3">No {config.key} found.</td></tr>}</tbody></table></div>}</>}
  </section>;
}

export default function CollegeManagement() { return <main className="admin-console admin-shell"><header className="admin-topbar"><div><p className="portal-eyebrow">Admin Dashboard</p><h1>Management</h1></div><button className="admin-secondary-btn" type="button" onClick={() => window.history.back()}>Back</button></header>{sections.map((section) => <ManagementSection key={section.key} config={section} initiallyOpen={false} />)}</main>; }
