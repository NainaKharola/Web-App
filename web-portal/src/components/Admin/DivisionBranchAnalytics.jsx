import { useMemo, useState } from "react";
import { branches } from "../../data/branches";
import { getAllocatedStudents } from "../../utils/administrationAnalytics";
import StudentDivisionRecommendation from "./StudentDivisionRecommendation";

const palette = ["#155eaa", "#2f8bd5", "#4da3e8", "#37a779", "#e4a33a", "#8b6bd9", "#df6b6b", "#2e8b8b"];

function PieChart({ data, emptyLabel }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <div className="analytics-chart analytics-chart--empty"><div className="analytics-pie analytics-pie--empty" role="img" aria-label="No students allocated"><span>0</span><small>Students</small></div><p className="analytics-chart__empty-message">{emptyLabel}</p></div>;
  const visibleData = data.filter((item) => item.value > 0);
  const { stops } = visibleData.reduce((state, item, index) => {
    const next = state.cursor + (item.value / total) * 100;
    state.stops.push(`${palette[index % palette.length]} ${state.cursor}% ${next}%`);
    return { cursor: next, stops: state.stops };
  }, { cursor: 0, stops: [] });
  return <div className="analytics-chart"><div className="analytics-pie" style={{ background: `conic-gradient(${stops.join(", ")})` }} aria-label="Student distribution chart" role="img"><span>{total}</span><small>Students</small></div><ul className="analytics-legend">{visibleData.map((item, index) => <li key={item.label}><i style={{ background: palette[index % palette.length] }} /><span>{item.label}</span><strong>{item.value} {item.value === 1 ? "Student" : "Students"}</strong></li>)}</ul></div>;
}

export default function DivisionBranchAnalytics({ administration, students, loading, error, onModeChange }) {
  const [mode, setMode] = useState("branch");
  const [selectedBranch, setSelectedBranch] = useState(branches[0] || "");
  const [selectedDivision, setSelectedDivision] = useState("");
  const activeDivision = administration.divisions.includes(selectedDivision) ? selectedDivision : administration.divisions[0] || "";
  const allocated = useMemo(() => getAllocatedStudents(students, administration.divisions), [students, administration.divisions]);
  const branchRows = useMemo(() => administration.divisions.map((division) => ({ label: division, value: allocated.filter((student) => student.branch === selectedBranch && student.trainingManagement?.division === division).length })), [administration.divisions, allocated, selectedBranch]);
  const divisionRows = useMemo(() => branches.map((branch) => ({ label: branch, value: allocated.filter((student) => student.trainingManagement?.division === activeDivision && student.branch === branch).length })), [allocated, activeDivision]);
  const activeRows = mode === "branch" ? branchRows : divisionRows;

  return <section className="administration-card administration-card--analytics">
    <div className="administration-card__heading"><span className="administration-icon" aria-hidden="true">◔</span><div><h2>Division &amp; Branch Analytics</h2><p>View real-time internship allocation statistics and vacancy insights.</p></div></div>
    <div className="analytics-tabs" role="tablist"><button type="button" role="tab" aria-selected={mode === "branch"} className={mode === "branch" ? "is-active" : ""} onClick={() => { setMode("branch"); onModeChange?.("branch"); }}>Branch Analytics</button><button type="button" role="tab" aria-selected={mode === "division"} className={mode === "division" ? "is-active" : ""} onClick={() => { setMode("division"); onModeChange?.("division"); }}>Division Analytics</button></div>
    {loading ? <div className="analytics-skeleton"><span /><span /><span /></div> : error ? <div className="analytics-empty"><span aria-hidden="true">!</span><p>{error}</p></div> : <>
      <div className="analytics-selector" aria-label={mode === "branch" ? "Select branch" : "Select division"}>{[...(mode === "branch" ? branches : administration.divisions)].sort((a, b) => a.localeCompare(b)).map((item) => <button type="button" key={item} className={(mode === "branch" ? selectedBranch : activeDivision) === item ? "is-active" : ""} onClick={() => mode === "branch" ? setSelectedBranch(item) : setSelectedDivision(item)}>{item}</button>)}</div>
      <div className="analytics-content"><div className="analytics-table-wrap"><table className="analytics-table"><thead><tr><th>{mode === "branch" ? "Division" : "Branch"}</th><th>Allocated Students</th></tr></thead><tbody>{activeRows.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.value}</td></tr>)}</tbody></table></div><PieChart data={activeRows} emptyLabel="No students currently allocated." /></div>
      {mode === "division" && <p className="analytics-caption">Chart: current student distribution by branch for {activeDivision || "the selected division"}.</p>}
    </>}
    <div className="analytics-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
      <StudentDivisionRecommendation students={students} administration={administration} />
    </div>
  </section>;
}
