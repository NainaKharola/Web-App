import { useCallback, useEffect, useMemo, useState } from "react";
import { branches } from "../../data/branches";
import { fetchAdminStudents } from "../../services/adminService";

const palette = ["#155eaa", "#2f8bd5", "#4da3e8", "#37a779", "#e4a33a", "#8b6bd9", "#df6b6b", "#2e8b8b"];

function PieChart({ data, emptyLabel, unit = "students" }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <div className="analytics-empty"><span aria-hidden="true">◌</span><p>{emptyLabel}</p></div>;
  let cursor = 0;
  const stops = data.filter((item) => item.value > 0).map((item, index) => {
    const start = cursor;
    cursor += (item.value / total) * 100;
    return `${palette[index % palette.length]} ${start}% ${cursor}%`;
  }).join(", ");
  return <div className="analytics-chart"><div className="analytics-pie" style={{ background: `conic-gradient(${stops})` }} aria-label="Analytics distribution chart" role="img"><span>{total}</span><small>{total === 1 ? unit.replace(/s$/, "") : unit}</small></div><ul className="analytics-legend">{data.filter((item) => item.value > 0).map((item, index) => <li key={item.label}><i style={{ background: palette[index % palette.length] }} /><span>{item.label}</span><strong>{Math.round((item.value / total) * 100)}%</strong></li>)}</ul></div>;
}

export default function DivisionBranchAnalytics({ administration }) {
  const [mode, setMode] = useState("branch");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(branches[0] || "");
  const [selectedDivision, setSelectedDivision] = useState(administration.divisions[0] || "");

  const loadStudents = useCallback(async () => {
    try { const { students: records } = await fetchAdminStudents({ status: "Approved" }); setStudents(records); setError(""); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStudents(); const refresh = window.setInterval(loadStudents, 30000); return () => window.clearInterval(refresh); }, [loadStudents]);
  useEffect(() => { const refresh = () => loadStudents(); window.addEventListener("administration-updated", refresh); return () => window.removeEventListener("administration-updated", refresh); }, [loadStudents]);
  useEffect(() => { if (!administration.divisions.includes(selectedDivision)) setSelectedDivision(administration.divisions[0] || ""); }, [administration.divisions, selectedDivision]);

  const allocated = useMemo(() => students.filter((student) => administration.divisions.includes(student.recommendedBy)), [students, administration.divisions]);
  const branchRows = useMemo(() => administration.divisions.map((division) => ({ label: division, value: allocated.filter((student) => student.branch === selectedBranch && student.recommendedBy === division).length })), [administration.divisions, allocated, selectedBranch]);
  const divisionRows = useMemo(() => branches.map((branch) => ({ label: branch, value: allocated.filter((student) => student.recommendedBy === selectedDivision && student.branch === branch).length })), [allocated, selectedDivision]);
  const vacancyRows = useMemo(() => administration.divisions.map((division) => ({ label: division, value: Math.max(0, Number(administration.divisionConfigurations?.[division]?.totalVacancy || 0) - allocated.filter((student) => student.recommendedBy === division).length) })), [administration, allocated]);
  const activeRows = mode === "branch" ? branchRows : divisionRows;

  return <section className="administration-card administration-card--analytics">
    <div className="administration-card__heading"><span className="administration-icon" aria-hidden="true">◔</span><div><h2>Division &amp; Branch Analytics</h2><p>View real-time internship allocation statistics and vacancy insights.</p></div></div>
    <div className="analytics-tabs" role="tablist"><button type="button" role="tab" aria-selected={mode === "branch"} className={mode === "branch" ? "is-active" : ""} onClick={() => setMode("branch")}>Branch Analytics</button><button type="button" role="tab" aria-selected={mode === "division"} className={mode === "division" ? "is-active" : ""} onClick={() => setMode("division")}>Division Analytics</button></div>
    {loading ? <div className="analytics-skeleton"><span /><span /><span /></div> : error ? <div className="analytics-empty"><span aria-hidden="true">!</span><p>{error}</p></div> : <>
      <div className="analytics-selector" aria-label={mode === "branch" ? "Select branch" : "Select division"}>{(mode === "branch" ? branches : administration.divisions).map((item) => <button type="button" key={item} className={(mode === "branch" ? selectedBranch : selectedDivision) === item ? "is-active" : ""} onClick={() => mode === "branch" ? setSelectedBranch(item) : setSelectedDivision(item)}>{item}</button>)}</div>
      <div className="analytics-content"><div className="analytics-table-wrap"><table className="analytics-table"><thead><tr><th>{mode === "branch" ? "Division" : "Branch"}</th><th>Allocated Students</th></tr></thead><tbody>{activeRows.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.value}</td></tr>)}</tbody></table></div><PieChart data={mode === "branch" ? branchRows : vacancyRows} unit={mode === "branch" ? "students" : "vacancies"} emptyLabel={mode === "branch" ? "No approved students from this branch have a division assignment yet." : "Configure vacancies or assign approved students to view capacity insights."} /></div>
      {mode === "division" && <p className="analytics-caption">Chart: remaining vacancies by division. The table shows branch distribution for {selectedDivision || "the selected division"}.</p>}
    </>}
  </section>;
}
