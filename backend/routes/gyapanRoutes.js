const express = require("express");
const { createPreview, editPreview, generateFinalPdf, getGyapanStudents, getPreview } = require("../controllers/gyapanController");
const router = express.Router();
router.get("/students", getGyapanStudents);
router.post("/preview", createPreview);
router.get("/:id", getPreview);
router.put("/:id/edit", editPreview);
router.post("/:id/generate", generateFinalPdf);
module.exports = router;
