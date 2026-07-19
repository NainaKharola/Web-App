const Gyapan = require("../models/Gyapan");
const Student = require("../models/Student");
const { generatePdfFromHtml } = require("../services/pdfService");
const { saveLocalFile } = require("../services/localStorageService");
const {
  generateGyapanHtml,
  studentToRow,
} = require("../services/gyapanService");

const { indiaDayRange } = require("../utils/dateRange");

async function getGyapanStudents(req, res) {
  try {
    const filter = {
      $and: [
        {
          $or: [
            { completedStatus: "Yes" },
            { "trainingManagement.completed": "Yes" },
          ],
        },
        {
          gyapanGenerated: { $ne: true },
        },
      ],
    };

    if (req.query.date) {
      const range = indiaDayRange(req.query.date);

      if (!range) {
        return res.status(400).json({
          success: false,
          message: "Select a valid completion date.",
        });
      }

      filter.$and.push({
        $or: [
          {
            completedStatus: "Yes",
            completedDate: range,
          },
          {
            "trainingManagement.completed": "Yes",
            "trainingManagement.completionDate": range,
          },
        ],
      });
    }

    const students = await Student.find(filter)
      .sort({ name: 1 })
      .lean();

    return res.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch completed students.",
    });
  }
}

async function selectedRows(ids) {
  const uniqueIds = [...new Set(Array.isArray(ids) ? ids : [])];
  if (!uniqueIds.length) {
    const error = new Error("Select at least one student.");
    error.statusCode = 400;
    throw error;
  }
  const students = await Student.find({
    _id: { $in: uniqueIds },
    gyapanGenerated: { $ne: true },
    $or: [
      { completedStatus: "Yes" },
      { "trainingManagement.completed": "Yes" },
    ],
  }).lean();
  if (students.length !== uniqueIds.length) {
    const error = new Error(
      "Only students marked Completed: Yes and without a generated Gyapan can be added.",
    );
    error.statusCode = 400;
    throw error;
  }
  return students.map(studentToRow);
}

async function createPreview(req, res) {
  try {
    const rows = await selectedRows(req.body.ids);
    const issueDate = req.body.issueDate
      ? new Date(req.body.issueDate)
      : new Date();
    if (Number.isNaN(issueDate.getTime()))
      return res
        .status(400)
        .json({ success: false, message: "Select a valid issue date." });
    const letterNumber = String(
      req.body.letterNumber ||
        `DRDO/GYAPAN/${new Date().getFullYear()}/${Date.now()}`,
    ).trim();
    const html = await generateGyapanHtml({ rows, letterNumber, issueDate });
    const gyapan = await Gyapan.create({
      letterNumber,
      issueDate,
      selectedStudents: rows.map((row) => row.studentId),
      studentRows: rows,
      html,
      generatedBy: req.admin.email,
    });
    return res
      .status(201)
      .json({
        success: true,
        gyapan,
        html,
        editable: {
          letterNumber,
          issueDate: issueDate.toISOString().slice(0, 10),
          studentRows: rows,
        },
      });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message: error.message || "Unable to create Gyapan preview.",
      });
  }
}

async function getPreview(req, res) {
  try {
    const gyapan = await Gyapan.findById(req.params.id).lean();
    if (!gyapan)
      return res
        .status(404)
        .json({ success: false, message: "Gyapan not found." });
    return res.json({
      success: true,
      gyapan,
      html: gyapan.html,
      editable: {
        letterNumber: gyapan.letterNumber,
        issueDate: gyapan.issueDate
          ? new Date(gyapan.issueDate).toISOString().slice(0, 10)
          : "",
        studentRows: gyapan.studentRows,
      },
    });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Unable to load Gyapan preview." });
  }
}

async function editPreview(req, res) {
  try {
    const gyapan = await Gyapan.findById(req.params.id);
    if (!gyapan)
      return res
        .status(404)
        .json({ success: false, message: "Gyapan not found." });
    const rows = Array.isArray(req.body.studentRows)
      ? req.body.studentRows
      : [];
    if (
      !rows.length ||
      !rows.every((row) => row.studentName && row.course && row.collegeName)
    )
      return res
        .status(400)
        .json({
          success: false,
          message: "Every row needs student name, course, and college name.",
        });
    const issueDate = new Date(req.body.issueDate);
    if (Number.isNaN(issueDate.getTime()))
      return res
        .status(400)
        .json({ success: false, message: "Select a valid issue date." });
    gyapan.letterNumber = String(req.body.letterNumber || "").trim();
    if (!gyapan.letterNumber)
      return res
        .status(400)
        .json({ success: false, message: "Letter number is required." });
    gyapan.issueDate = issueDate;
    gyapan.studentRows = rows;
    gyapan.selectedStudents = rows.map((row) => row.studentId).filter(Boolean);
    gyapan.html = await generateGyapanHtml({
      rows,
      letterNumber: gyapan.letterNumber,
      issueDate,
    });
    await gyapan.save();
    return res.json({
      success: true,
      gyapan,
      html: gyapan.html,
      message: "Gyapan preview updated.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Unable to save Gyapan changes.",
      });
  }
}

async function generateFinalPdf(req, res) {
  try {
    const gyapan = await Gyapan.findById(req.params.id);
    if (!gyapan)
      return res
        .status(404)
        .json({ success: false, message: "Gyapan not found." });
    if (gyapan.generated)
      return res.json({
        success: true,
        gyapan,
        pdfUrl: gyapan.pdfUrl,
        message: "Gyapan PDF has already been generated.",
      });
    const pdf = await generatePdfFromHtml(gyapan.html);
    const upload = await saveLocalFile(
      pdf,
      "gyapan",
      `Gyapan-${gyapan._id}.pdf`,
    );
    console.log("UPLOAD OBJECT:", upload);
    console.log("PDF URL:", upload.url);
    gyapan.generated = true;
    gyapan.generatedDate = new Date();
    gyapan.generatedBy = req.admin.email;
    gyapan.pdfUrl = upload.url;
    gyapan.gyapanUrl = upload.url;
    gyapan.publicId = upload.filename;
    await gyapan.save();
    for (const studentId of gyapan.selectedStudents) {
  await Student.findByIdAndUpdate(studentId, {
    $set: {
      gyapanGenerated: true,
    },
  });
}
    return res.json({
      success: true,
      gyapan,
      pdfUrl: gyapan.pdfUrl,
      message: "Gyapan PDF generated and uploaded successfully.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Gyapan PDF generation failed.",
      });
  }
}

module.exports = {
  createPreview,
  editPreview,
  generateFinalPdf,
  getGyapanStudents,
  getPreview,
};
