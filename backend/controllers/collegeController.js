const collegeService = require("../services/collegeService");
const { logActivity } = require("../utils/activityLogger");

async function listColleges(req, res, next) {
  try { res.json(await collegeService.readColleges()); } catch (error) { next(error); }
}

async function createCollege(req, res, next) {
  try {
    const college = await collegeService.addCollege(req.body.name);
    await logActivity({
      req,
      module: "Management Module",
      action: "Added College",
      description: `Added new college: '${req.body.name}'.`,
      status: "Success",
    });
    res.status(201).json({ success: true, college });
  } catch (error) {
    await logActivity({
      req,
      module: "Management Module",
      action: "Added College",
      description: `Failed to add college: '${req.body.name || "Unknown"}'. Error: ${error.message}`,
      status: "Failed",
    });
    next(error);
  }
}

async function editCollege(req, res, next) {
  try { res.json({ success: true, college: await collegeService.updateCollege(req.params.id, req.body.name) }); } catch (error) { next(error); }
}

async function removeCollege(req, res, next) {
  try {
    const college = await collegeService.deleteCollege(req.params.id);
    await logActivity({
      req,
      module: "Management Module",
      action: "Deleted College",
      description: `Deleted college: '${college?.name || req.params.id}'.`,
      status: "Success",
    });
    res.json({ success: true, college });
  } catch (error) {
    await logActivity({
      req,
      module: "Management Module",
      action: "Deleted College",
      description: `Failed to delete college. Error: ${error.message}`,
      status: "Failed",
    });
    next(error);
  }
}

module.exports = { listColleges, createCollege, editCollege, removeCollege };
