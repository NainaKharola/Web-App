import { useState } from "react";
import { fetchAdministration, fetchAdminStudents } from "../../services/adminService";
import { getBranchDivisionRecommendations } from "../../utils/administrationAnalytics";

export default function StudentDivisionRecommendation({ student }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  const showRecommendations = async () => {
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const [{ administration }, { students }] = await Promise.all([
        fetchAdministration(),
        fetchAdminStudents({ status: "Approved", sortBy: "submittedAt", sortOrder: "desc" }),
      ]);
      setRecommendations(getBranchDivisionRecommendations(
        administration.divisions,
        administration.divisionConfigurations,
        students,
        student.branch,
      ));
    } catch (requestError) {
      setError(requestError.message || "Unable to load division recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return <>
    <button className="admin-secondary-btn" type="button" onClick={showRecommendations}>Suggest Division</button>
    {open && <div className="administration-dialog-backdrop recommendation-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="recommendation-modal" role="dialog" aria-modal="true" aria-labelledby="division-recommendation-title">
        <div className="recommendation-modal__heading"><div><p className="portal-eyebrow">Branch-based recommendation</p><h2 id="division-recommendation-title">Suggest Division</h2><p>Live capacity for <strong>{student.branch}</strong>. You can still assign any division manually.</p></div><button className="admin-secondary-btn" type="button" onClick={() => setOpen(false)}>Close</button></div>
        {loading ? <div className="analytics-skeleton"><span /><span /><span /></div> : error ? <p className="admin-error">{error}</p> : <div className="recommendation-table-wrap"><table className="recommendation-table"><thead><tr><th>Division</th><th>Scope %</th><th>Students Allocated</th><th>Available Seats</th></tr></thead><tbody>{recommendations.map((row, index) => <tr className={index === 0 && row.availableSeats > 0 ? "recommendation-table__best" : ""} key={row.division}><td><strong>{row.division}</strong>{index === 0 && row.availableSeats > 0 && <span className="recommendation-badge">Best match</span>}</td><td><span className="recommendation-scope"><i style={{ width: `${row.scope}%` }} />{row.scope.toFixed(1)}%</span></td><td>{row.allocatedStudents} / {row.configuredSeats}</td><td>{row.availableSeats}</td></tr>)}</tbody></table>{!recommendations.length && <div className="analytics-empty"><p>No divisions are configured yet.</p></div>}</div>}
      </section>
    </div>}
  </>;
}
