const express = require("express");
const {
  getAdminProfile,
  loginAdmin,
  registerAdmin,
} = require("../controllers/adminAuthController");
const {
  deleteStudents,
  downloadCertificates,
  getCertificateStudents,
  getStudentById,
  getStudents,
  recommendedByOptions,
  saveTrainingManagement,
  updateStudentReview,
  uploadOfferLetter,
} = require("../controllers/adminStudentController");
const { protectAdmin } = require("../middleware/adminAuth");
const { ensureApprovedStudent } = require("../middleware/ensureApprovedStudent");
const { uploadOfferLetter: uploadOfferLetterFile } = require("../middleware/offerLetterUpload");
const createGyapanRouter = require("./gyapanRoutes");

const router = express.Router();

router.post("/auth/register", registerAdmin);
router.post("/auth/login", loginAdmin);
router.get("/auth/me", protectAdmin, getAdminProfile);
router.use("/gyapan", protectAdmin, createGyapanRouter());
router.use("/gyapan1", protectAdmin, createGyapanRouter(true));

router.get("/recommended-by-options", protectAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    options: recommendedByOptions,
  });
});

router.get("/students", protectAdmin, getStudents);
router.get("/certificates/students", protectAdmin, getCertificateStudents);
router.post("/certificates/download", protectAdmin, downloadCertificates);
router.get("/certificate1/students", protectAdmin, (req, res, next) => { req.bufferMode = true; next(); }, getCertificateStudents);
router.post("/certificate1/download", protectAdmin, (req, res, next) => { req.bufferMode = true; next(); }, downloadCertificates);
router.delete("/students", protectAdmin, deleteStudents);
router.get("/students/:id", protectAdmin, getStudentById);
router.patch("/students/:id/review", protectAdmin, updateStudentReview);
router.patch(
  "/students/:id/training-management",
  protectAdmin,
  saveTrainingManagement
);
router.post(
  "/students/:id/offer-letter",
  protectAdmin,
  ensureApprovedStudent,
  uploadOfferLetterFile,
  uploadOfferLetter
);

module.exports = router;
