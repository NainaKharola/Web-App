import { memo } from "react";
import StatusBadge from "./StatusBadge";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN");
}

const StudentRow = memo(function StudentRow({
  deleteMode = false,
  isSelected = false,
  onSelect,
  serialNumber,
  student,
  onView,
}) {
  const handleSelectChange = (event) => {
    if (onSelect) {
      onSelect(student._id, event.target.checked);
    }
  };

  const handleViewClick = () => {
    if (onView) {
      onView(student._id);
    }
  };

  return (
    <tr>
      {deleteMode && (
        <td>
          <input
            checked={isSelected}
            type="checkbox"
            onChange={handleSelectChange}
            aria-label={`Select ${student.name}`}
          />
        </td>
      )}
      <td>{serialNumber}</td>
      <td>{student.referenceId || "-"}</td>
      <td>{student.name}</td>
      <td>{student.collegeName}</td>
      <td>{student.branch}</td>
      <td>{student.year}</td>
      <td>{student.cgpa}</td>
      <td>{formatDate(student.submittedAt)}</td>
      <td>
        <StatusBadge value={student.status} />
      </td>
      <td>
        <StatusBadge value={student.offerLetterStatus || "Not Sent"} />
      </td>
      <td>{formatDate(student.approvedDate)}</td>
      <td>
        <button className="admin-secondary-btn admin-table-action" type="button" onClick={handleViewClick}>
          View Details
        </button>
      </td>
    </tr>
  );
});

export default StudentRow;
