const statusClass = {
  Pending: "status-badge status-badge--pending",
  Approved: "status-badge status-badge--approved",
  Rejected: "status-badge status-badge--rejected",
  Sent: "status-badge status-badge--approved",
  "Not Sent": "status-badge status-badge--muted",
};

function StatusBadge({ value }) {
  return (
    <span className={statusClass[value] || "status-badge status-badge--muted"}>
      {value || "Pending"}
    </span>
  );
}

export default StatusBadge;
