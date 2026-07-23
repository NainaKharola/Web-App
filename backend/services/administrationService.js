const fs = require("fs/promises");
const path = require("path");

const filePath = path.join(__dirname, "..", "data", "administration.json");
const defaultConfiguration = {
  totalAllocatedSeats: 250,
  divisions: [
    "Servo System", "ABS", "SS & ST", "NS (Naval System)", "OD (Optical Design)", "CS & S", "ALTDS", "LI", "LS", "LPF", "Photonics", "EAD", "LIDAR", "FTIR", "HR", "MS", "ISO", "AI", "VI", "IRST", "OME", "LIC", "ENV", "Reprography", "MT", "P & C", "AV", "CMD", "DIR", "HRD", "WORKS", "MI", "SECURITY",
  ],
  divisionConfigurations: {},
};

const clone = (value) => JSON.parse(JSON.stringify(value));

async function getAdministration() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    const value = JSON.parse(await fs.readFile(filePath, "utf8"));
    if (!Array.isArray(value.divisions) || !Number.isInteger(value.totalAllocatedSeats)) throw new Error("Invalid administration configuration");
    value.divisionConfigurations = value.divisionConfigurations && typeof value.divisionConfigurations === "object" ? value.divisionConfigurations : {};
    value.divisions.forEach((division) => {
      const entry = value.divisionConfigurations[division];
      value.divisionConfigurations[division] = {
        allowedBranches: Array.isArray(entry?.allowedBranches) ? entry.allowedBranches : [],
        totalVacancy: Number.isSafeInteger(entry?.totalVacancy) && entry.totalVacancy >= 0 ? entry.totalVacancy : 0,
      };
    });
    Object.keys(value.divisionConfigurations).forEach((division) => {
      if (!value.divisions.includes(division)) delete value.divisionConfigurations[division];
    });
    return value;
  } catch (error) {
    if (error.code !== "ENOENT" && error.name !== "SyntaxError") throw error;
    const config = clone(defaultConfiguration);
    await saveAdministration(config);
    return config;
  }
}

async function saveAdministration(configuration) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(configuration, null, 2)}\n`, "utf8");
  await fs.rename(temporaryPath, filePath);
  return configuration;
}

module.exports = { getAdministration, saveAdministration };
