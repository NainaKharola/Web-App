const { getAdministration } = require("./administrationService");

const seatCount = (value) => Math.max(0, Number(value) || 0);

function calculateTotalVacancy(configuration) {
  return (configuration?.allowedBranches || []).reduce((total, branch) => total + seatCount(configuration?.branchSeats?.[branch]), 0);
}

function calculateAvailableSeats(configuredSeats, allocatedStudents) {
  return Math.max(0, seatCount(configuredSeats) - seatCount(allocatedStudents));
}

function calculateUtilization(allocatedStudents, configuredSeats) {
  const capacity = seatCount(configuredSeats);
  return capacity ? (seatCount(allocatedStudents) / capacity) * 100 : 0;
}

async function validateDivisionCapacity({ Student, studentId, division, branch }) {
  const administration = await getAdministration();
  if (!administration.divisions.includes(division)) return "Select a valid division.";
  const configuration = administration.divisionConfigurations[division];
  const branchSeats = seatCount(configuration?.branchSeats?.[branch]);
  const totalVacancy = calculateTotalVacancy(configuration);
  if (!configuration?.allowedBranches?.includes(branch) || branchSeats === 0) return `No seats are configured for ${branch} in ${division}.`;

  const assigned = await Student.find({ status: "Approved", "trainingManagement.division": division }).lean();
  const otherStudents = assigned.filter((assignedStudent) => String(assignedStudent._id) !== String(studentId));
  if (calculateAvailableSeats(totalVacancy, otherStudents.length) === 0) return `${division} is full.`;
  const allocatedForBranch = otherStudents.filter((assignedStudent) => assignedStudent.branch === branch).length;
  if (calculateAvailableSeats(branchSeats, allocatedForBranch) === 0) return `No ${branch} seats are available in ${division}.`;
  return "";
}

module.exports = { calculateTotalVacancy, calculateAvailableSeats, calculateUtilization, validateDivisionCapacity };
