const express = require("express");
const { listColleges } = require("../controllers/collegeController");

const router = express.Router();

router.get("/", listColleges);

module.exports = router;
