const express = require("express");
const multer = require("multer");
const {
  generateOfferLetter,
  generateOfferLetterPdf,
  getOfferLetterPreview,
  sendOfferLetter,
  updateOfferLetter,
  uploadOfferLetterPdf,
} = require("../controllers/offerLetterController");
const { protectAdmin } = require("../middleware/adminAuth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Offer Letter must be a PDF file."));
    }

    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

function handleUploadErrors(req, res, next) {
  upload.single("offerLetter")(req, res, (error) => {
    if (!error) return next();

    const message =
      error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
        ? "Offer Letter file size must not exceed 10MB."
        : error.message;

    return res.status(400).json({
      success: false,
      message,
    });
  });
}

router.use(protectAdmin);

router.post("/:studentId/generate", generateOfferLetter);
router.get("/:studentId", getOfferLetterPreview);
router.put("/:studentId", updateOfferLetter);
router.post("/:studentId/pdf", generateOfferLetterPdf);
router.post("/:studentId/upload", handleUploadErrors, uploadOfferLetterPdf);
router.post("/:studentId/send", sendOfferLetter);

module.exports = router;
