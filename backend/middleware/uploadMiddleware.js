const multer = require("multer");
const { saveLocalFile } = require("../services/localStorageService");

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PHOTO_MAX_FILE_SIZE = 1 * 1024 * 1024;

const uploadFolders = {
  resume: "resumes",
  result: "results",
  photo: "photos",
  permissionLetter: "permissionLetters",
  aadhaarCard: "aadhaarCards",
};

const allowedTypes = {
  resume: ["application/pdf"],
  result: ["application/pdf", "image/jpeg", "image/jpg"],
  photo: ["image/png", "image/jpeg", "image/jpg"],
  permissionLetter: [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ],
  aadhaarCard: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
};

// Keep validation behaviour intact, then persist accepted files locally.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = allowedTypes[file.fieldname];

  if (!allowed) {
    return cb(new Error("Unexpected file field."));
  }

  if (!allowed.includes(file.mimetype)) {
    if (file.fieldname === "aadhaarCard") {
      return cb(new Error("Only PDF, JPG, JPEG and PNG files are allowed."));
    }
    return cb(new Error(`${file.fieldname} has an invalid file type.`));
  }

  cb(null, true);
}

function validatePerFieldSize(req, file, cb) {
  const maxSize = file.fieldname === "photo" ? PHOTO_MAX_FILE_SIZE : MAX_FILE_SIZE;

  if (file.size > maxSize) {
    return cb(
      new Error(
        file.fieldname === "aadhaarCard"
          ? "Maximum allowed file size is 10 MB."
          : file.fieldname === "photo"
          ? "Photo size should not exceed 1 MB."
          : `${file.fieldname} size should not exceed 10 MB.`
      )
    );
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    fileFilter(req, file, (error) => {
      if (error) return cb(error);
      validatePerFieldSize(req, file, cb);
    });
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).fields([
  { name: "resume", maxCount: 1 },
  { name: "result", maxCount: 1 },
  { name: "photo", maxCount: 1 },
  { name: "permissionLetter", maxCount: 1 },
  { name: "aadhaarCard", maxCount: 1 },
]);

function uploadStudentDocuments(req, res, next) {
  upload(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        const message =
          error.code === "LIMIT_FILE_SIZE"
            ? "Maximum allowed file size is 10 MB."
            : error.message;

        return res.status(400).json({
          success: false,
          message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    try {
      const uploadedFiles = {};

      if (req.files) {
        // Pre-validate all file sizes first before starting any upload
        for (const fieldName of Object.keys(req.files)) {
          const file = req.files[fieldName][0];
          if (fieldName === "photo" && file.size > PHOTO_MAX_FILE_SIZE) {
            return res.status(400).json({
              success: false,
              message: "Photo size should not exceed 1 MB.",
            });
          }
        }

        const uploadPromises = Object.keys(req.files).map(async (fieldName) => {
          const file = req.files[fieldName][0];
          const result = await saveLocalFile(file.buffer, uploadFolders[fieldName], file.originalname);
          return {
            fieldName,
            data: {
              url: result.url,
              public_id: result.filename,
              originalName: file.originalname,
            },
          };
        });

        const results = await Promise.all(uploadPromises);
        for (const uploadRes of results) {
          uploadedFiles[uploadRes.fieldName] = uploadRes.data;
          console.log("Uploaded:", uploadRes.data.url);
        }
      }

      req.uploadedFiles = uploadedFiles;

      next();
    } 
    catch (err) {
    return res.status(500).json({
      success: false,
      message: "File upload failed.",
      error: err.message,
    });
  }
  });
}

const completedDocumentsUpload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Completed documents must be uploaded as a single PDF."));
    }

    cb(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single("completedDocuments");

function uploadCompletedDocuments(req, res, next) {
  completedDocumentsUpload(req, res, async (error) => {
    if (error) {
      const message =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "Maximum file size allowed is 10 MB."
          : error.message;

      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Upload Form 1 and Form 2 as a single PDF file.",
      });
    }

    try {
      const result = await saveLocalFile(req.file.buffer, "completedDocuments", req.file.originalname);

      req.uploadedCompletedDocuments = {
        url: result.url,
        publicId: result.filename,
      };

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "File upload failed.",
        error: err.message,
      });
    }
  });
}

module.exports = { uploadCompletedDocuments, uploadStudentDocuments };
