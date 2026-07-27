import { useMemo, useState } from "react";
import { formatUtilization, getDivisionAllocationRows } from "../../utils/administrationAnalytics";

export default function DivisionRecommendation({ administration, students, loading, error }) {
  const [visible, setVisible] = useState(false);
  const recommendations = useMemo(() => getDivisionAllocationRows(administration.divisions, administration.divisionConfigurations, students), [administration.divisions, administration.divisionConfigurations, students]);

  return <section className="administration-card administration-card--recommendation">
    <div className="administration-card__heading"><span className="administration-icon" aria-hidden="true">✦</span><div><h2>Suggest Division</h2><p>Rank divisions by their live available capacity to guide the next allocation.</p></div></div>
    <div className="recommendation-toolbar"><p>Recommendations prioritize available seats; lower utilization breaks ties.</p><button className="admin-primary-btn" type="button" onClick={() => setVisible(true)}>Suggest Division</button></div>
    {visible && (loading ? <div className="analytics-skeleton"><span /><span /></div> : error ? <div className="analytics-empty"><span aria-hidden="true">!</span><p>{error}</p></div> : <div className="recommendation-table-wrap"><table className="recommendation-table"><thead><tr><th>Division</th><th>Utilization %</th><th>Students Allocated</th><th>Available Seats</th></tr></thead><tbody>{recommendations.map((row) => <tr key={row.division}><td><strong>{row.division}</strong></td><td>{formatUtilization(row.utilization)}</td><td>{row.allocatedStudents} / {row.totalVacancy}</td><td>{row.isFull ? "Full" : row.availableSeats}</td></tr>)}</tbody></table>{!recommendations.length && <div className="analytics-empty"><span aria-hidden="true">○</span><p>Add a division to generate recommendations.</p></div>}</div>)}
  </section>;
}
