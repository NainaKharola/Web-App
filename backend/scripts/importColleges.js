const fs = require("fs");
const path = require("path");
const { writeJson } = require("../services/localStorageService");

async function importColleges() {
  const csvPath = path.join(__dirname, "..", "data", "UniversityList.csv");
  const names = (await fs.promises.readFile(csvPath, "utf8"))
    .split(/\r?\n/)
    .map((line) => line.replace(/^"|"$/g, "").trim())
    .filter(Boolean);
  const uniqueNames = [...new Set(names)];
  await writeJson("colleges.json", uniqueNames.map((name, index) => ({ _id: `college-${index + 1}`, name })));
  console.log(`Imported ${uniqueNames.length} colleges into backend/data/colleges.json.`);
}

importColleges().catch((error) => { console.error(error); process.exitCode = 1; });
