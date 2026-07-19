const Student = require("../models/Student");

async function ensureApprovedStudent(req, res, next) {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    if (student.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Offer Letter can only be sent after approval.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to verify student approval status.",
      error: error.message,
    });
  }
}

module.exports = { ensureApprovedStudent };
