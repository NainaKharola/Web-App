const multer = require("multer");
const { saveLocalFile } = require("../services/localStorageService");

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Offer Letter must be a PDF file."));
    }

    cb(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single("offerLetter");

function uploadOfferLetter(req, res, next) {
  upload(req, res, async (error) => {
    if (error) {
      const message =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "Offer Letter file size must not exceed 10MB."
          : error.message;

      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Offer Letter PDF is required.",
      });
    }

    try {
      const result = await saveLocalFile(req.file.buffer, "offerLetters", req.file.originalname);

      req.uploadedOfferLetter = {
        url: result.url,
        publicId: result.filename,
      };

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Offer Letter upload failed.",
        error: err.message,
      });
    }
  });
}

module.exports = { uploadOfferLetter };
