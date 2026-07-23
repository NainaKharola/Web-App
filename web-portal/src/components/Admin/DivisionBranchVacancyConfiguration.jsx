import { useEffect, useRef, useState } from "react";
import { branches } from "../../data/branches";
import { saveDivisionConfigurations } from "../../services/adminService";

const emptyConfiguration = () => ({ allowedBranches: [], totalVacancy: 0 });

export default function DivisionBranchVacancyConfiguration({ administration, onSaved, onError }) {
  const [configurations, setConfigurations] = useState({});
  const [openDivision, setOpenDivision] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => setConfigurations(administration.divisionConfigurations || {}), [administration]);
  useEffect(() => {
    const close = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setOpenDivision(""); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const update = (division, changes) => setConfigurations((current) => ({ ...current, [division]: { ...(current[division] || emptyConfiguration()), ...changes } }));
  const toggleBranch = (division, branch) => {
    const selected = configurations[division]?.allowedBranches || [];
    update(division, { allowedBranches: selected.includes(branch) ? selected.filter((item) => item !== branch) : [...selected, branch] });
  };
  const save = async () => {
    setSaving(true);
    try { const { configurations: saved } = await saveDivisionConfigurations(configurations); setConfigurations(saved); onSaved(saved); }
    catch (error) { onError(error.message); }
    finally { setSaving(false); }
  };
  const filteredBranches = branches.filter((branch) => branch.toLowerCase().includes(search.toLowerCase()));

  return <section className="administration-card administration-card--configuration">
    <div className="administration-card__heading"><span className="administration-icon" aria-hidden="true">⚙</span><div><h2>Division Branch &amp; Vacancy Configuration</h2><p>Configure eligible branches and internship vacancies for every division.</p></div></div>
    <div className="division-configuration-table-wrap"><table className="division-configuration-table"><thead><tr><th>Division Names</th><th>Allowed Branches</th><th>Total Vacancy</th></tr></thead><tbody>
      {administration.divisions.map((division) => {
        const configuration = configurations[division] || emptyConfiguration();
        const isOpen = openDivision === division;
        return <tr key={division}><td><strong>{division}</strong></td><td><div className="branch-select" ref={isOpen ? dropdownRef : null}><button className="branch-select__trigger" type="button" aria-expanded={isOpen} onClick={() => { setOpenDivision(isOpen ? "" : division); setSearch(""); }}><span>{configuration.allowedBranches.length ? `${configuration.allowedBranches.length} branch${configuration.allowedBranches.length === 1 ? "" : "es"} selected` : "Select Branches"}</span><span className="branch-select__chevron" aria-hidden="true">⌄</span></button><div className={`branch-select__menu ${isOpen ? "branch-select__menu--open" : ""}`} aria-hidden={!isOpen}><input className="branch-select__search" tabIndex={isOpen ? 0 : -1} placeholder="Search branches..." value={search} onChange={(event) => setSearch(event.target.value)} /><div className="branch-select__options">{filteredBranches.map((branch) => <label key={branch} className="branch-select__option"><input type="checkbox" checked={configuration.allowedBranches.includes(branch)} onChange={() => toggleBranch(division, branch)} /><span>{branch}</span></label>)}{!filteredBranches.length && <p className="branch-select__empty">No branches found.</p>}</div></div></div></td><td><input className="vacancy-input" type="text" inputMode="numeric" value={configuration.totalVacancy} onChange={(event) => { if (/^\d*$/.test(event.target.value)) update(division, { totalVacancy: event.target.value === "" ? 0 : Number(event.target.value) }); }} aria-label={`Total vacancy for ${division}`} /></td></tr>;
      })}
    </tbody></table></div>
    <div className="division-configuration-actions"><span>{administration.divisions.length} divisions configured</span><button className="admin-primary-btn" type="button" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save Configuration"}</button></div>
  </section>;
}
