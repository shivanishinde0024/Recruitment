const mastersService = require('./masters.service');
const { ok, created } = require('../../utils/response');

exports.list = async (req, res) => {
  const result = await mastersService.listMasters(req.params.type, req.query);
  return ok(res, result.items, 'Masters loaded', result.meta);
};

exports.getById = async (req, res) => {
  const item = await mastersService.getMasterById(req.params.type, req.params.id);
  return ok(res, item, 'Master record loaded');
};

exports.create = async (req, res) => {
  const item = await mastersService.createMaster(req.params.type, req.body, req);
  return created(res, item, 'Master record created successfully');
};

exports.update = async (req, res) => {
  const item = await mastersService.updateMaster(req.params.type, req.params.id, req.body, req);
  return ok(res, item, 'Master record updated successfully');
};

exports.toggle = async (req, res) => {
  const item = await mastersService.toggleMaster(req.params.type, req.params.id, req);
  return ok(res, item, 'Status updated successfully');
};

exports.remove = async (req, res) => {
  const result = await mastersService.deleteMaster(req.params.type, req.params.id, req);
  return ok(res, null, result.message);
};

