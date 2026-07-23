export function getAllocatedStudents(students, divisions) {
  const divisionSet = new Set(divisions);
  return students.filter((student) => student.status === "Approved" && Boolean(student.submittedAt) && divisionSet.has(student.recommendedBy));
}

export function getBranchSeatCapacity(configuration, branch) {
  const configuredSeats = configuration?.branchSeats?.[branch];
  if (Number.isFinite(Number(configuredSeats))) return Math.max(0, Number(configuredSeats));
  return configuration?.allowedBranches?.includes(branch)
    ? Math.max(0, Number(configuration.totalVacancy || 0))
    : 0;
}

export function getAllocatedStudentCount(students, division, branch, divisions) {
  return getAllocatedStudents(students, divisions).filter((student) => (
    student.recommendedBy === division && student.branch === branch
  )).length;
}

export function getBranchDivisionRecommendations(divisions, configurations, students, branch) {
  const rows = divisions.map((division) => {
    const configuredSeats = getBranchSeatCapacity(configurations?.[division], branch);
    const allocatedStudents = getAllocatedStudentCount(students, division, branch, divisions);
    return { division, configuredSeats, allocatedStudents, availableSeats: Math.max(0, configuredSeats - allocatedStudents) };
  }).sort((left, right) => right.availableSeats - left.availableSeats || left.division.localeCompare(right.division));

  const totalAvailableSeats = rows.reduce((sum, row) => sum + row.availableSeats, 0);
  return rows.map((row) => ({ ...row, scope: totalAvailableSeats ? (row.availableSeats / totalAvailableSeats) * 100 : 0 }));
}

export function getDivisionAllocationRows(divisions, configurations, students) {
  const allocated = getAllocatedStudents(students, divisions);
  const allocations = allocated.reduce((counts, student) => {
    counts[student.recommendedBy] = (counts[student.recommendedBy] || 0) + 1;
    return counts;
  }, {});

  const rows = divisions.map((division) => {
    const allocatedStudents = allocations[division] || 0;
    const totalVacancy = Number(configurations?.[division]?.totalVacancy || 0);
    return {
      division,
      allocatedStudents,
      availableSeats: Math.max(0, totalVacancy - allocatedStudents),
    };
  }).sort((left, right) => right.availableSeats - left.availableSeats || left.division.localeCompare(right.division));

  const totalAvailableSeats = rows.reduce((sum, row) => sum + row.availableSeats, 0);
  return rows.map((row) => ({
    ...row,
    scope: totalAvailableSeats ? (row.availableSeats / totalAvailableSeats) * 100 : 0,
  }));
}

export function calculateTotalVacancy(configuration) {
  if (!configuration) return 0;
  const allowed = configuration.allowedBranches || [];
  const seats = configuration.branchSeats || {};
  return allowed.reduce((sum, branch) => {
    const seatVal = seats[branch];
    const seatNum = seatVal === "" || seatVal === undefined || seatVal === null ? 0 : Number(seatVal);
    const validSeat = Number.isInteger(seatNum) && seatNum >= 0 ? seatNum : 0;
    return sum + validSeat;
  }, 0);
}

