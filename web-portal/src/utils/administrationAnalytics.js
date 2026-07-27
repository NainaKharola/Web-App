export function getAllocatedStudents(students, divisions) {
  const divisionSet = new Set(divisions);
  return students.filter((student) => student.status === "Approved" && Boolean(student.submittedAt) && divisionSet.has(student.recommendedBy));
}

const nonNegativeNumber = (value) => Math.max(0, Number(value) || 0);

export function getBranchSeatCapacity(configuration, branch) {
  const configuredSeats = configuration?.branchSeats?.[branch];
  if (Number.isFinite(Number(configuredSeats))) return nonNegativeNumber(configuredSeats);
  return configuration?.allowedBranches?.includes(branch) ? nonNegativeNumber(configuration.totalVacancy) : 0;
}

export function calculateTotalVacancy(configuration) {
  return (configuration?.allowedBranches || []).reduce((sum, branch) => sum + getBranchSeatCapacity(configuration, branch), 0);
}

export function calculateAvailableSeats(configuredSeats, allocatedStudents) {
  return Math.max(0, nonNegativeNumber(configuredSeats) - nonNegativeNumber(allocatedStudents));
}

export function calculateUtilization(allocatedStudents, configuredSeats) {
  const capacity = nonNegativeNumber(configuredSeats);
  return capacity ? (nonNegativeNumber(allocatedStudents) / capacity) * 100 : 0;
}

export function formatUtilization(utilization) {
  return `${Number(Number(utilization || 0).toFixed(1))}%`;
}

export function sortRecommendations(rows) {
  return [...rows].sort((left, right) => right.availableSeats - left.availableSeats || left.utilization - right.utilization || left.division.localeCompare(right.division));
}

export function getAllocatedStudentCount(students, division, branch, divisions) {
  return getAllocatedStudents(students, divisions).filter((student) => student.recommendedBy === division && student.branch === branch).length;
}

export function getBranchDivisionRecommendations(divisions, configurations, students, branch) {
  const rows = divisions.map((division) => {
    const configuredSeats = getBranchSeatCapacity(configurations?.[division], branch);
    const allocatedStudents = getAllocatedStudentCount(students, division, branch, divisions);
    const availableSeats = calculateAvailableSeats(configuredSeats, allocatedStudents);
    return { division, configuredSeats, allocatedStudents, availableSeats, utilization: calculateUtilization(allocatedStudents, configuredSeats) };
  });
  return sortRecommendations(rows.filter((row) => row.availableSeats > 0));
}

export function getDivisionAllocationRows(divisions, configurations, students) {
  const allocated = getAllocatedStudents(students, divisions);
  const allocations = allocated.reduce((counts, student) => ({ ...counts, [student.recommendedBy]: (counts[student.recommendedBy] || 0) + 1 }), {});
  return sortRecommendations(divisions.map((division) => {
    const allocatedStudents = allocations[division] || 0;
    const totalVacancy = calculateTotalVacancy(configurations?.[division]);
    const availableSeats = calculateAvailableSeats(totalVacancy, allocatedStudents);
    return { division, totalVacancy, allocatedStudents, availableSeats, utilization: calculateUtilization(allocatedStudents, totalVacancy), isFull: availableSeats === 0 };
  }));
}
