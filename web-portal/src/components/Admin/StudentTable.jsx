import StudentRow from "./StudentRow";

function StudentTable({
  deleteMode = false,
  onSelect,
  onView,
  selectedIds = [],
  students,
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {deleteMode && <th>Select</th>}
            <th>Serial No.</th>
            <th>Reference ID</th>
            <th>Student Name</th>
            <th>College / University</th>
            <th>Branch</th>
            <th>Year</th>
            <th>CGPA</th>
            <th>Registration Date</th>
            <th>Current Status</th>
            <th>Offer Letter Status</th>
            <th>Approved Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <StudentRow
              key={student._id}
              deleteMode={deleteMode}
              isSelected={selectedIds.includes(student._id)}
              onSelect={onSelect}
              serialNumber={index + 1}
              student={student}
              onView={onView}
            />
          ))}
        </tbody>
      </table>
      {!students.length && (
        <div className="admin-empty-state">No students match the current view.</div>
      )}
    </div>
  );
}

export default StudentTable;
