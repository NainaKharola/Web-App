const express = require("express");
const { createPreview, editPreview, generateFinalPdf, getGyapanStudents, getPreview } = require("../controllers/gyapanController");
function createGyapanRouter(bufferMode = false) {
const router = express.Router();
if (bufferMode) router.use((req, res, next) => { req.bufferMode = true; next(); });
router.get("/students", getGyapanStudents);
router.post("/preview", createPreview);
router.get("/:id", getPreview);
router.put("/:id/edit", editPreview);
router.post("/:id/generate", generateFinalPdf);
return router;
}
module.exports = createGyapanRouter;
