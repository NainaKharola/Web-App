const express = require("express");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const router = express.Router();

router.get("/", (req, res) => {
  const colleges = [];
  const csvPath = path.join(__dirname, "..", "data", "UniversityList.csv");

  console.log("CSV Path:", csvPath);
  console.log("File Exists:", fs.existsSync(csvPath));

  fs.createReadStream(csvPath)
    .pipe(csv())
.on("data", (row) => {
    console.log("ROW:", row);

    const values = Object.values(row);

    if (values.length > 0 && values[0]) {
        colleges.push({
            name: values[0].trim(),
        });
    }
})
.on("end", () => {
    console.log("Total colleges:", colleges.length);
    res.json(colleges);
})
    .on("error", (err) => {
      res.status(500).json({
        message: err.message,
      });
    });
});

module.exports = router;