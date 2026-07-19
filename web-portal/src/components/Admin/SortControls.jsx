const sortOptions = [
  ["submittedAt", "desc", "Registration Date: Newest First"],
  ["submittedAt", "asc", "Registration Date: Oldest First"],
  ["collegeName", "asc", "College: A-Z"],
  ["collegeName", "desc", "College: Z-A"],
  ["branch", "asc", "Branch: A-Z"],
  ["branch", "desc", "Branch: Z-A"],
  ["year", "asc", "Year: Ascending"],
  ["year", "desc", "Year: Descending"],
  ["cgpa", "asc", "CGPA: Ascending"],
  ["cgpa", "desc", "CGPA: Descending"],
];

function SortControls({ sort, onChange }) {
  const selectedValue = `${sort.sortBy}:${sort.sortOrder}`;

  return (
    <label className="admin-field admin-field--sort">
      <span>Sort By</span>
      <select
        value={selectedValue}
        onChange={(event) => {
          const [sortBy, sortOrder] = event.target.value.split(":");
          onChange({ sortBy, sortOrder });
        }}
      >
        {sortOptions.map(([sortBy, sortOrder, label]) => (
          <option key={`${sortBy}:${sortOrder}`} value={`${sortBy}:${sortOrder}`}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default SortControls;
