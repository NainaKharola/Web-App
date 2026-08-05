import { useState } from "react";
import { fetchAdministration, fetchAdminStudents } from "../../services/adminService";
import { formatUtilization, getBranchDivisionRecommendations, getGeneralDivisionRecommendations } from "../../utils/administrationAnalytics";

export default function StudentDivisionRecommendation({ student, students: propStudents, administration: propAdministration }) {
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState(""), [recommendations, setRecommendations] = useState([]);
  const showRecommendations = async () => {
    setOpen(true);
    if (propStudents && propAdministration) {
      if (student) {
        setRecommendations(getBranchDivisionRecommendations(propAdministration.divisions, propAdministration.divisionConfigurations, propStudents, student.branch));
      } else {
        setRecommendations(getGeneralDivisionRecommendations(propAdministration.divisions, propAdministration.divisionConfigurations, propStudents));
      }
      return;
    }
    setLoading(true); setError("");
    try {
      const [{ administration }, { students }] = await Promise.all([fetchAdministration(), fetchAdminStudents({ sortBy: "submittedAt", sortOrder: "desc" })]);
      if (student) {
        setRecommendations(getBranchDivisionRecommendations(administration.divisions, administration.divisionConfigurations, students, student.branch));
      } else {
        setRecommendations(getGeneralDivisionRecommendations(administration.divisions, administration.divisionConfigurations, students));
      }
    } catch (requestError) { setError(requestError.message || "Unable to load division recommendations."); } finally { setLoading(false); }
  };
  return <>
    <button className="admin-secondary-btn" type="button" onClick={showRecommendations}>Suggest Division</button>
    {open && <div className="administration-dialog-backdrop recommendation-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="recommendation-modal" role="dialog" aria-modal="true" aria-labelledby="division-recommendation-title">
      <div className="recommendation-modal__heading">
        <div>
          <p className="portal-eyebrow">{student ? "Branch-based recommendation" : "Live vacancy overview"}</p>
          <h2 id="division-recommendation-title">Suggest Division</h2>
          {student ? (
            <p>Live capacity for <strong>{student.branch}</strong>. Full branches are excluded from recommendations.</p>
          ) : (
            <p>Live capacity across all divisions.</p>
          )}
        </div>
        <button className="admin-secondary-btn" type="button" onClick={() => setOpen(false)}>Close</button>
      </div>
      {loading ? <div className="analytics-skeleton"><span /><span /><span /></div> : error ? <p className="admin-error">{error}</p> : recommendations.length > 0 ? <div className="recommendation-table-wrap"><table className="recommendation-table"><thead><tr><th>Division</th><th>Utilization %</th><th>Students Allocated</th><th>Available Seats</th></tr></thead><tbody>{recommendations.map((row, index) => <tr className={student && index === 0 ? "recommendation-table__best" : ""} key={row.division}><td><strong>{row.division}</strong>{student && index === 0 && <span className="recommendation-badge">Best match</span>}</td><td><span className="recommendation-utilization"><i style={{ width: `${Math.min(100, row.utilization)}%` }} />{formatUtilization(row.utilization)}</span></td><td>{row.allocatedStudents} / {row.configuredSeats}</td><td>{row.isNull ? "NULL" : row.availableSeats}</td></tr>)}</tbody></table></div> : <div className="analytics-empty"><p>{student ? `No divisions have seat configuration for ${student.branch}.` : "No divisions configured."}</p></div>}
    </section></div>}
  </>;
}
