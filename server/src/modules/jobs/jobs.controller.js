const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const jobsService = require('./jobs.service');

const create = asyncHandler(async (req, res) => {
  const job = await jobsService.createJob(req.body, req.user, req);
  return created(res, job, 'Job created successfully');
});

const list = asyncHandler(async (req, res) => {
  const result = await jobsService.listJobs(req.query, req.user);
  return ok(res, result.items, 'Jobs retrieved successfully', result.meta);
});

const getById = asyncHandler(async (req, res) => {
  const job = await jobsService.getJobById(req.params.id, req.user);
  return ok(res, job, 'Job details retrieved successfully');
});

const update = asyncHandler(async (req, res) => {
  const job = await jobsService.updateJob(req.params.id, req.body, req.user, req);
  return ok(res, job, 'Job updated successfully');
});

const updateStatus = asyncHandler(async (req, res) => {
  const job = await jobsService.updateJobStatus(req.params.id, req.body, req.user, req);
  return ok(res, job, 'Job status updated successfully');
});

const assignStaff = asyncHandler(async (req, res) => {
  const job = await jobsService.assignStaff(req.params.id, req.body, req.user, req);
  return ok(res, job, 'Staff member assigned successfully');
});

const remove = asyncHandler(async (req, res) => {
  const result = await jobsService.deleteJob(req.params.id, req.user, req);
  return ok(res, result, result.message);
});

module.exports = {
  create,
  list,
  getById,
  update,
  updateStatus,
  assignStaff,
  remove
};
