const service = require("../services/managementItemService");
const type = (req) => req.params.type;
exports.list = async (req, res, next) => { try { res.json(await service.list(type(req))); } catch (error) { next(error); } };
exports.create = async (req, res, next) => { try { res.status(201).json({ success: true, item: await service.create(type(req), req.body.name) }); } catch (error) { next(error); } };
exports.update = async (req, res, next) => { try { res.json({ success: true, item: await service.update(type(req), req.params.id, req.body.name) }); } catch (error) { next(error); } };
exports.remove = async (req, res, next) => { try { res.json({ success: true, item: await service.remove(type(req), req.params.id) }); } catch (error) { next(error); } };
