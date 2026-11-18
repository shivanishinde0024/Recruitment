const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const mappingsService = require('./mappings.service');

const create = asyncHandler(async (req, res) => {
  const result = await mappingsService.mapCandidatesToJob(req.body, req.user, req);
  return created(res, result, `Mapped ${result.mapped_count} candidate(s) to requisition.`);
});

const getSuggested = asyncHandler(async (req, res) => {
  const candidates = await mappingsService.getSuggestedCandidates(req.params.jobId, req.user);
  return ok(res, candidates, 'Suggested candidates ranked by match score');
});

const list = asyncHandler(async (req, res) => {
  const mappings = await mappingsService.listJobMappings(req.params.jobId, req.query, req.user);
  return ok(res, mappings, 'Candidates mapped to requisition');
});

const review = asyncHandler(async (req, res) => {
  const updated = await mappingsService.reviewCandidate(req.params.id, req.body, req.user, req);
  return ok(res, updated, `Candidate review marked as '${updated.status}'`);
});

const withdraw = asyncHandler(async (req, res) => {
  const updated = await mappingsService.withdrawMapping(req.params.id, req.body, req.user, req);
  return ok(res, updated, 'Candidate submission withdrawn successfully');
});

module.exports = {
  create,
  getSuggested,
  list,
  review,
  withdraw
};
