const fs = require("fs/promises");
const path = require("path");

const collegesPath = path.join(__dirname, "..", "data", "colleges.json");
let writeQueue = Promise.resolve();

function normalizeName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

function comparableName(name) {
  return normalizeName(name).toLocaleLowerCase("en-US");
}

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function readColleges() {
  try {
    const raw = await fs.readFile(collegesPath, "utf8");
    const colleges = JSON.parse(raw);
    if (!Array.isArray(colleges)) throw new Error("College data must be an array.");
    return colleges
      .filter((college) => Number.isInteger(college.id) && normalizeName(college.name))
      .map((college) => ({ id: college.id, name: normalizeName(college.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw createError(`Unable to read college data: ${error.message}`, 500);
  }
}

async function saveColleges(colleges) {
  const directory = path.dirname(collegesPath);
  const temporaryPath = `${collegesPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(temporaryPath, `${JSON.stringify(colleges, null, 2)}\n`, "utf8");
    await fs.rename(temporaryPath, collegesPath);
  } catch (error) {
    await fs.unlink(temporaryPath).catch(() => {});
    throw createError(`Unable to save college data: ${error.message}`, 500);
  }
}

function queueMutation(operation) {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.catch(() => {});
  return result;
}

async function findCollege(id) {
  const college = (await readColleges()).find((item) => item.id === Number(id));
  return college || null;
}

function duplicateExists(colleges, name, exceptId) {
  const normalized = comparableName(name);
  return colleges.some((college) => college.id !== exceptId && comparableName(college.name) === normalized);
}

function addCollege(name) {
  return queueMutation(async () => {
    const cleanedName = normalizeName(name);
    if (!cleanedName) throw createError("College name is required.", 400);
    const colleges = await readColleges();
    if (duplicateExists(colleges, cleanedName)) throw createError("College already exists.", 409);
    const id = colleges.reduce((maximum, college) => Math.max(maximum, college.id), 0) + 1;
    const college = { id, name: cleanedName };
    await saveColleges([...colleges, college]);
    return college;
  });
}

function updateCollege(id, name) {
  return queueMutation(async () => {
    const numericId = Number(id);
    const cleanedName = normalizeName(name);
    if (!cleanedName) throw createError("College name is required.", 400);
    const colleges = await readColleges();
    const index = colleges.findIndex((college) => college.id === numericId);
    if (index === -1) throw createError("College not found.", 404);
    if (duplicateExists(colleges, cleanedName, numericId)) throw createError("College already exists.", 409);
    const college = { ...colleges[index], name: cleanedName };
    colleges[index] = college;
    await saveColleges(colleges);
    return college;
  });
}

function deleteCollege(id) {
  return queueMutation(async () => {
    const numericId = Number(id);
    const colleges = await readColleges();
    const college = colleges.find((item) => item.id === numericId);
    if (!college) throw createError("College not found.", 404);
    await saveColleges(colleges.filter((item) => item.id !== numericId));
    return college;
  });
}

module.exports = { readColleges, saveColleges, findCollege, addCollege, updateCollege, deleteCollege };
