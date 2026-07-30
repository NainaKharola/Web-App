const Student = require("../models/Student");
const { generatePdfsFromHtml } = require("../services/pdfService");
const { logActivity } = require("../utils/activityLogger");
const {
  certificateFileName,
  generateCertificateHtml,
} = require("../services/certificateService");
const { removeLocalFile } = require("../services/localStorageService");
const {
  sendOfferLetterEmail,
  sendRejectionEmail,
} = require("../services/emailService");
const { indiaDayRange } = require("../utils/dateRange");
const { validateDivisionCapacity } = require("../services/divisionCapacityService");

const reviewFields = ["status", "remark", "referenceBy", "recommendedBy"];

const allowedStatuses = ["Pending", "Approved", "Rejected"];

const recommendedByOptions = [
  "Servo System",
  "ABS",
  "SS & ST",
  "NS (Naval System)",
  "OD (Optical Design)",
  "CS & S",
  "ALTDS",
  "LI",
  "LS",
  "LPF",
  "Photonics",
  "EAD",
  "LIDAR",
  "FTIR",
  "HR",
  "MS",
  "ISO",
  "AI",
  "VI",
  "IRST",
  "OME",
  "LIC",
  "ENV",
  "Reprography",
  "MT",
  "P & C",
  "AV",
  "CMD",
  "DIR",
  "HRD",
  "WORKS",
  "MI",
  "SECURITY",
];

function buildStudentFilter(query) {
  const filter = {};
  const conditions = [];

  if (query.search) {
    const expression = { $regex: query.search, $options: "i" };
    conditions.push({
      $or: [{ name: expression }, { referenceId: expression }],
    });
  }

  if (query.collegeName) filter.collegeName = query.collegeName;
  if (query.branch) filter.branch = query.branch;
  if (query.year) filter.year = query.year;

  if (query.status === "Pending") {
    conditions.push({
      $or: [{ status: "Pending" }, { status: { $exists: false } }],
    });
  } else if (query.status) {
    filter.status = query.status;
  }

  if (conditions.length) filter.$and = conditions;

  if (query.registrationDate) {
    const start = new Date(query.registrationDate);
    const end = new Date(query.registrationDate);
    end.setDate(end.getDate() + 1);

    filter.submittedAt = {
      $gte: start,
      $lt: end,
    };
  }

  return filter;
}

function buildSort(sortBy, sortOrder) {
  const map = {
    collegeName: "collegeName",
    branch: "branch",
    year: "year",
    cgpa: "cgpa",
    submittedAt: "submittedAt",
  };

  if (!map[sortBy]) return { submittedAt: -1 };

  return {
    [map[sortBy]]: sortOrder === "asc" ? 1 : -1,
  };
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function addDurationToDate(fromDate, duration) {
  if (!fromDate) return "";

  const date = new Date(fromDate);
  if (Number.isNaN(date.getTime())) return "";

  const monthMatch = String(duration || "").match(/(\d+)\s*month/i);
  const weekMatch = String(duration || "").match(/(\d+)\s*week/i);

  if (monthMatch) { date.setMonth(date.getMonth() + Number(monthMatch[1])); date.setDate(date.getDate() - 1); }
  else if (weekMatch) date.setDate(date.getDate() + Number(weekMatch[1]) * 7 - 1);
  else return "";

  return date.toISOString().slice(0, 10);
}

async function removeStudentAssets(student) {
  await Promise.allSettled([
    removeLocalFile(student.resume),
    removeLocalFile(student.result),
    removeLocalFile(student.photo),
    removeLocalFile(student.permissionLetter),
    removeLocalFile(student.aadhaarCard),
    removeLocalFile(student.completedDocuments),
    removeLocalFile(student.offerLetter),
    removeLocalFile(student.offerLetterUrl),
  ]);
}

async function getStudents(req, res) {
  try {
    const filter = buildStudentFilter(req.query);
    const sort = buildSort(req.query.sortBy, req.query.sortOrder);
    const projection =
      "_id referenceId name collegeName branch year cgpa submittedAt status recommendedBy trainingManagement offerLetterStatus approvedDate";

    const [
      students,
      totalStudents,
      pendingApplications,
      approvedStudents,
      rejectedStudents,
      offerLettersSent,
    ] = await Promise.all([
      Student.find(filter).select(projection).sort(sort).lean(),
      Student.countDocuments({}),
      Student.countDocuments({
        $or: [{ status: "Pending" }, { status: { $exists: false } }],
      }),
      Student.countDocuments({ status: "Approved" }),
      Student.countDocuments({ status: "Rejected" }),
      Student.countDocuments({ offerLetterStatus: "Sent" }),
    ]);

    const summary = {
      totalStudents,
      pendingApplications,
      approvedStudents,
      rejectedStudents,
      offerLettersSent,
    };

    return res.status(200).json({
      success: true,
      students,
      summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch students.",
      error: error.message,
    });
  }
}

async function getCertificateStudents(req, res) {
  try {
    const deleteAfterDownload = req.bufferMode !== true;
    const completionStatus = [{ completedStatus: "Yes" }];
    const filter = {
      $and: [
        { $or: completionStatus },
        ...(req.bufferMode === true ? [{ certificateBufferRemoved: { $ne: true } }] : []),
        ...(deleteAfterDownload ? [{ certificateGenerated: { $ne: true } }] : []),
      ],
    };
    if (req.query.search?.trim()) {
      filter.$and.push({
        name: { $regex: req.query.search.trim(), $options: "i" },
      });
    }
    if (req.query.date) {
      const range = indiaDayRange(req.query.date);
      if (!range) {
        return res
          .status(400)
          .json({ success: false, message: "Select a valid completion date." });
      }
      filter.$and.push({
        $or: [
          { completedStatus: "Yes", completedDate: range },
        ],
      });
    }
    const students = await Student.find(
      filter,
      "name referenceId collegeName course branch year location internshipDuration trainingManagement",
    )
      .sort({ "trainingManagement.toDate": -1, name: 1 })
      .lean();

    return res.status(200).json({ success: true, students });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch completed trainees.",
    });
  }
}

async function removeCertificateBufferStudents(req, res) {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  if (!ids.length) return res.status(400).json({ success: false, message: "Select at least one student to remove." });
  await Promise.all(ids.map((id) => Student.findByIdAndUpdate(id, { certificateBufferRemoved: true })));
  return res.json({ success: true, message: "Selected students removed from the certificate buffer." });
}

async function downloadCertificates(req, res) {
  try {
    const deleteAfterDownload = req.bufferMode !== true;
    const ids = [
      ...new Set(
        Array.isArray(req.body.ids)
          ? req.body.ids
          : [req.body.id].filter(Boolean),
      ),
    ];

    if (!ids.length) {
      return res
        .status(400)
        .json({ success: false, message: "Select a student." });
    }
    if (deleteAfterDownload && ids.length > 1) {
      return res.status(400).json({
        success: false,
        message:
          "Certificates are downloaded individually. Generate one certificate at a time.",
      });
    }

    const students = await Student.find({
      _id: { $in: ids },
      ...(deleteAfterDownload ? { certificateGenerated: { $ne: true } } : {}),
      $or: [{ completedStatus: "Yes" }],
    }).lean();

    if (students.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message:
          "Certificates are available only for students marked as completed.",
      });
    }

    const student = students[0];
    const [pdf] = await generatePdfsFromHtml([
      generateCertificateHtml(student),
    ]);
    if (deleteAfterDownload) {
      await Student.findByIdAndUpdate(student._id, {
        certificateGenerated: true,
      });
    }

    await logActivity({
      req,
      module: "Certificate",
      action: "Printed Certificate",
      description: `Printed certificate for ${student.name}.`,
      status: "Success",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${certificateFileName(student)}"`,
    );
    return res.status(200).send(pdf);
  } catch (error) {
    await logActivity({
      req,
      module: "Certificate",
      action: "Printed Certificate",
      description: `Failed to print certificate. Error: ${error.message}`,
      status: "Failed",
    });

    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Certificate generation failed." });
    }
    res.destroy(error);
  }
}

async function getStudentById(req, res) {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch student details.",
      error: error.message,
    });
  }
}

async function updateStudentReview(req, res) {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid status.",
      });
    }

    const wasRejected = student.status === "Rejected";
    const oldStatus = student.status;

    reviewFields.forEach((field) => {
      student[field] = req.body[field] || "";
    });

    student.reviewedBy = req.admin.email;
    student.reviewedAt = new Date();

    if (student.status === "Approved" && !student.approvedDate) {
      student.approvedDate = new Date();
    }

    await student.save();

    let emailResult = null;

    if (student.status === "Rejected" && !wasRejected) {
      emailResult = await sendRejectionEmail(student);
    }

    let logAction = "Edited Student Details";
    let logDescription = `Edited student details for ${student.name}.`;
    if (oldStatus !== student.status) {
      if (student.status === "Approved") {
        logAction = "Approved Student";
        logDescription = `Approved student ${student.name}.`;
      } else if (student.status === "Rejected") {
        logAction = "Rejected Student";
        logDescription = `Rejected student ${student.name}.`;
      }
    }

    await logActivity({
      req,
      module: "Student Module",
      action: logAction,
      description: logDescription,
      status: "Success",
    });

    return res.status(200).json({
      success: true,
      student,
      email: emailResult,
      message: "Review updated successfully.",
    });
  } catch (error) {
    await logActivity({
      req,
      module: "Student Module",
      action: req.body?.status === "Approved" ? "Approved Student" : (req.body?.status === "Rejected" ? "Rejected Student" : "Edited Student Details"),
      description: `Failed to update student review/details. Error: ${error.message}`,
      status: "Failed",
    });

    return res.status(500).json({
      success: false,
      message: "Unable to update review.",
      error: error.message,
    });
  }
}

async function deleteStudents(req, res) {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];

    if (!ids.length) {
      return res.status(400).json({
        success: false,
        message: "Select at least one registration to delete.",
      });
    }

    const students = await Student.find({ _id: { $in: ids } });
    await Promise.all(students.map(removeStudentAssets));
    await Student.deleteMany({
      _id: { $in: students.map((student) => student._id) },
    });

    await logActivity({
      req,
      module: "Student Module",
      action: "Deleted Student",
      description: `Deleted ${students.length} student registrations: ${students.map((student) => student.name).join(", ")}.`,
      status: "Success",
    });

    return res.status(200).json({
      success: true,
      deletedCount: students.length,
      message: "Selected registrations deleted successfully.",
    });
  } catch (error) {
    await logActivity({
      req,
      module: "Student Module",
      action: "Deleted Student",
      description: `Failed to delete student registrations. Error: ${error.message}`,
      status: "Failed",
    });

    return res.status(500).json({
      success: false,
      message: "Unable to delete selected registrations.",
      error: error.message,
    });
  }
}

async function saveTrainingManagement(req, res) {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const oldDiv = student.trainingManagement?.division;
    const oldJoined = student.joinedStatus;
    const oldCompleted = student.completedStatus;
    const oldFromDate = student.trainingManagement?.fromDate;
    const oldToDate = student.trainingManagement?.toDate;

    const division = String(req.body.division || "").trim();
    if (division) {
      const capacityError = await validateDivisionCapacity({
        Student,
        studentId: student._id,
        division,
        branch: req.body.branch || student.branch,
      });
      if (capacityError) return res.status(400).json({ success: false, message: capacityError });
    }

    const training = {
      studentName: req.body.studentName || student.name,
      courseName: req.body.courseName || student.course,
      courseYear: req.body.courseYear || student.year,
      branch: req.body.branch || student.branch,
      collegeName: req.body.collegeName || student.collegeName,
      collegeLocation: req.body.collegeLocation || student.location,
      trainingDuration: req.body.trainingDuration || student.internshipDuration,
      fromDate: req.body.fromDate || "",
      toDate:
        req.body.toDate ||
        addDurationToDate(
          req.body.fromDate,
          req.body.trainingDuration || student.internshipDuration,
        ),
      joined: req.body.joined || "",
      division,
      joinedDate:
        req.body.joined === "Yes"
          ? (student.trainingManagement?.joined === "Yes" &&
              student.trainingManagement?.joinedDate) ||
            new Date()
          : null,
      projectTitle: req.body.projectTitle || "",
      projectGuide: req.body.projectGuide || "",
      designation: req.body.designation || "",
      leaveAvailed: req.body.leaveAvailed || "",
      completed: req.body.completed || "",
      completionDate:
        req.body.completed === "Yes"
          ? (student.trainingManagement?.completed === "Yes" &&
              student.trainingManagement?.completionDate) ||
            new Date(`${new Date().toLocaleDateString("en-CA")}T12:00:00`)
          : null,
      updatedBy: req.admin.email,
      updatedAt: new Date(),
    };

    // ===== Sync main Student document =====

    student.name = training.studentName;
    student.course = training.courseName;
    student.year = training.courseYear;
    student.branch = training.branch;

    student.collegeName = training.collegeName;
    student.location = training.collegeLocation;

    student.internshipDuration = training.trainingDuration;

    student.trainingManagement = training;
    // Keep Offer Letter data in sync

    if (student.offerLetter) {
      student.offerLetter.studentName = training.studentName;
      student.offerLetter.course = training.courseName;
      student.offerLetter.year = training.courseYear;
      student.offerLetter.branch = training.branch;

      student.offerLetter.collegeName = training.collegeName;
      student.offerLetter.collegeLocation = training.collegeLocation;

      student.offerLetter.internshipDuration = training.trainingDuration;
    }
    student.joinedStatus = training.joined;
    student.joinedDate = training.joinedDate || undefined;
    student.completedStatus = training.completed;
    student.completedDate = training.completionDate || undefined;

    await student.save();

    let logAction = "Updated Training Details";
    let logDescription = `Updated training details for ${student.name}.`;

    if (oldDiv !== division) {
      logAction = "Changed Division";
      logDescription = `Changed division for ${student.name} from '${oldDiv || "None"}' to '${division || "None"}'.`;
    } else if (oldJoined !== req.body.joined) {
      logAction = "Updated Joined Status";
      logDescription = `Updated joined status for ${student.name} to '${req.body.joined}'.`;
    } else if (oldCompleted !== req.body.completed) {
      logAction = "Updated Completion Status";
      logDescription = `Updated completion status for ${student.name} to '${req.body.completed}'.`;
    } else if (oldFromDate !== req.body.fromDate || oldToDate !== training.toDate) {
      logAction = "Updated Dates";
      logDescription = `Updated training dates for ${student.name}.`;
    }

    await logActivity({
      req,
      module: "Training Management",
      action: logAction,
      description: logDescription,
      status: "Success",
    });

    return res.status(200).json({
      success: true,
      student,
      message: "Training details saved successfully.",
    });
  } catch (error) {
    await logActivity({
      req,
      module: "Training Management",
      action: "Updated Training Details",
      description: `Failed to update training details. Error: ${error.message}`,
      status: "Failed",
    });

    return res.status(500).json({
      success: false,
      message: "Unable to save Training Management details.",
      error: error.message,
    });
  }
}

async function uploadOfferLetter(req, res) {
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

    // Save Offer Letter details
    student.offerLetterUrl = req.uploadedOfferLetter.url;
    student.offerLetterPublicId = req.uploadedOfferLetter.publicId;
    student.offerLetterUploadedDate = new Date();
    student.offerLetterSentBy = req.admin.email;

    let emailResult = null;

    try {
      // Try sending email
      emailResult = await sendOfferLetterEmail(student);

      if (emailResult?.skipped) {
        student.offerLetterStatus = "Not Sent";
        student.offerLetterSentDate = undefined;
      } else {
        student.offerLetterStatus = "Sent";
        student.offerLetterSentDate = new Date();
      }
    } catch (emailError) {
      console.error("Email Error:", emailError);

      // Don't fail the entire request if email sending fails
      student.offerLetterStatus = "Email Failed";
      student.offerLetterSentDate = undefined;
    }

    await student.save();

    await logActivity({
      req,
      module: "Offer Letter",
      action: "Sent Offer Letter",
      description: `Uploaded and sent offer letter to ${student.name}.`,
      status: "Success",
    });

    return res.status(200).json({
      success: true,
      student,
      email: emailResult,
      message:
        student.offerLetterStatus === "Sent"
          ? "Offer Letter uploaded and emailed successfully."
          : "Offer Letter uploaded successfully, but email could not be sent.",
    });
  } catch (error) {
    console.error(error);

    await logActivity({
      req,
      module: "Offer Letter",
      action: "Sent Offer Letter",
      description: `Failed to upload and send offer letter. Error: ${error.message}`,
      status: "Failed",
    });

    return res.status(500).json({
      success: false,
      message: "Unable to upload Offer Letter.",
      error: error.message,
    });
  }
}

module.exports = {
  deleteStudents,
  downloadCertificates,
  getCertificateStudents,
  removeCertificateBufferStudents,
  getStudents,
  getStudentById,
  updateStudentReview,
  uploadOfferLetter,
  saveTrainingManagement,
  recommendedByOptions,
};
