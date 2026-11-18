const { z } = require('zod');

const createMappingSchema = z.object({
  job_id: z.coerce.number().int().positive('Job ID is required'),
  candidate_ids: z.array(z.coerce.number().int().positive()).min(1, 'At least one candidate ID is required')
});

const companyReviewSchema = z.object({
  action: z.enum(['viewed', 'shortlisted', 'confirmed', 'rejected', 'hold'], {
    errorMap: () => ({ message: "Action must be 'viewed', 'shortlisted', 'confirmed', 'rejected', or 'hold'" })
  }),
  remark: z.string().optional()
});

const withdrawMappingSchema = z.object({
  reason: z.string().optional()
});

module.exports = {
  createMappingSchema,
  companyReviewSchema,
  withdrawMappingSchema
};
