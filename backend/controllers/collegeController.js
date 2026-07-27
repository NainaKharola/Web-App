const collegeService = require("../services/collegeService");

async function listColleges(req, res, next) {
  try { res.json(await collegeService.readColleges()); } catch (error) { next(error); }
}

async function createCollege(req, res, next) {
  try { res.status(201).json({ success: true, college: await collegeService.addCollege(req.body.name) }); } catch (error) { next(error); }
}

async function editCollege(req, res, next) {
  try { res.json({ success: true, college: await collegeService.updateCollege(req.params.id, req.body.name) }); } catch (error) { next(error); }
}

async function removeCollege(req, res, next) {
  try { res.json({ success: true, college: await collegeService.deleteCollege(req.params.id) }); } catch (error) { next(error); }
}

module.exports = { listColleges, createCollege, editCollege, removeCollege };
