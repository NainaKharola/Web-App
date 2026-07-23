const { getAdministration, saveAdministration } = require("../services/administrationService");

const normalise = (value) => String(value || "").trim().replace(/\s+/g, " ");
const isDuplicate = (divisions, name, excluded = "") => divisions.some((division) => division.toLocaleLowerCase() === name.toLocaleLowerCase() && division !== excluded);
const respondError = (res, message) => res.status(400).json({ success: false, message });

async function getConfiguration(req, res, next) {
  try { res.json({ success: true, administration: await getAdministration() }); } catch (error) { next(error); }
}

async function addDivision(req, res, next) {
  try {
    const name = normalise(req.body.name);
    if (!name) return respondError(res, "Division name cannot be empty.");
    const administration = await getAdministration();
    if (isDuplicate(administration.divisions, name)) return respondError(res, "A division with this name already exists.");
    administration.divisions.push(name);
    administration.divisionConfigurations[name] = { allowedBranches: [], totalVacancy: 0 };
    await saveAdministration(administration);
    res.status(201).json({ success: true, message: "Division added successfully.", administration });
  } catch (error) { next(error); }
}

async function updateDivision(req, res, next) {
  try {
    const previousName = normalise(req.params.name);
    const name = normalise(req.body.name);
    if (!name) return respondError(res, "Division name cannot be empty.");
    const administration = await getAdministration();
    const index = administration.divisions.findIndex((division) => division === previousName);
    if (index < 0) return res.status(404).json({ success: false, message: "Division not found." });
    if (isDuplicate(administration.divisions, name, previousName)) return respondError(res, "A division with this name already exists.");
    administration.divisions[index] = name;
    administration.divisionConfigurations[name] = administration.divisionConfigurations[previousName] || { allowedBranches: [], totalVacancy: 0 };
    delete administration.divisionConfigurations[previousName];
    await saveAdministration(administration);
    res.json({ success: true, message: "Division updated successfully.", administration });
  } catch (error) { next(error); }
}

async function deleteDivision(req, res, next) {
  try {
    const name = normalise(req.params.name);
    const administration = await getAdministration();
    const index = administration.divisions.findIndex((division) => division === name);
    if (index < 0) return res.status(404).json({ success: false, message: "Division not found." });
    administration.divisions.splice(index, 1);
    delete administration.divisionConfigurations[name];
    await saveAdministration(administration);
    res.json({ success: true, message: "Division deleted successfully.", administration });
  } catch (error) { next(error); }
}

async function updateSeats(req, res, next) {
  try {
    const totalAllocatedSeats = Number(req.body.totalAllocatedSeats);
    if (!Number.isSafeInteger(totalAllocatedSeats) || totalAllocatedSeats <= 0) return respondError(res, "Enter a positive whole number for total allocated seats.");
    const administration = await getAdministration();
    administration.totalAllocatedSeats = totalAllocatedSeats;
    await saveAdministration(administration);
    res.json({ success: true, message: "Seat allocation updated successfully.", administration });
  } catch (error) { next(error); }
}

async function getDivisionConfigurations(req, res, next) {
  try {
    const administration = await getAdministration();
    res.json({ success: true, divisions: administration.divisions, configurations: administration.divisionConfigurations });
  } catch (error) { next(error); }
}

async function saveDivisionConfigurations(req, res, next) {
  try {
    const requested = req.body.configurations;
    if (!requested || typeof requested !== "object" || Array.isArray(requested)) return respondError(res, "Division configuration data is required.");
    const administration = await getAdministration();
    const configurations = {};
    for (const division of administration.divisions) {
      const entry = requested[division] || {};
      const allowedBranches = Array.isArray(entry.allowedBranches) ? [...new Set(entry.allowedBranches.map((branch) => String(branch).trim()).filter(Boolean))] : [];
      const totalVacancy = Number(entry.totalVacancy ?? 0);
      if (!Number.isSafeInteger(totalVacancy) || totalVacancy < 0) return respondError(res, `Enter a whole number of 0 or more for ${division}.`);
      configurations[division] = { allowedBranches, totalVacancy };
    }
    administration.divisionConfigurations = configurations;
    await saveAdministration(administration);
    res.json({ success: true, message: "Division configuration updated successfully.", configurations });
  } catch (error) { next(error); }
}

module.exports = { getConfiguration, addDivision, updateDivision, deleteDivision, updateSeats, getDivisionConfigurations, saveDivisionConfigurations };
