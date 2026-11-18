const { z } = require('zod');
const { sanitizeHtml } = require('../../utils/sanitize');

const sanitize = (val) => (typeof val === 'string' ? sanitizeHtml(val) : val);

const jobSkillItemSchema = z.object({
  skill_id: z.coerce.number().int().positive(),
  is_mandatory: z.boolean().default(false)
});

const createJobSchema = z.object({
  title: z.string().min(2, 'Job title is required').max(200),
  company_id: z.coerce.number().int().positive().optional(),
  job_category_id: z.coerce.number().int().positive().optional().nullable(),
  employment_type_id: z.coerce.number().int().positive().optional().nullable(),
  qualification_id: z.coerce.number().int().positive().optional().nullable(),
  experience_min: z.coerce.number().min(0).default(0),
  experience_max: z.coerce.number().min(0).default(0),
  salary_min: z.coerce.number().min(0).optional().nullable(),
  salary_max: z.coerce.number().min(0).optional().nullable(),
  salary_negotiable: z.boolean().default(false),
  positions_required: z.coerce.number().int().min(1, 'At least 1 position is required'),
  last_date: z.string().optional().nullable(),
  country_id: z.coerce.number().int().positive().optional().nullable(),
  state_id: z.coerce.number().int().positive().optional().nullable(),
  city_id: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().optional().transform(sanitize),
  responsibilities: z.string().optional().transform(sanitize),
  benefits: z.string().optional().transform(sanitize),
  skills: z.array(jobSkillItemSchema).optional().default([])
}).refine((data) => data.experience_max >= data.experience_min, {
  message: 'Maximum experience must be greater than or equal to minimum experience',
  path: ['experience_max']
}).refine((data) => {
  if (data.salary_min != null && data.salary_max != null) {
    return data.salary_max >= data.salary_min;
  }
  return true;
}, {
  message: 'Maximum salary must be greater than or equal to minimum salary',
  path: ['salary_max']
});

const updateJobSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  job_category_id: z.coerce.number().int().positive().optional().nullable(),
  employment_type_id: z.coerce.number().int().positive().optional().nullable(),
  qualification_id: z.coerce.number().int().positive().optional().nullable(),
  experience_min: z.coerce.number().min(0).optional(),
  experience_max: z.coerce.number().min(0).optional(),
  salary_min: z.coerce.number().min(0).optional().nullable(),
  salary_max: z.coerce.number().min(0).optional().nullable(),
  salary_negotiable: z.boolean().optional(),
  positions_required: z.coerce.number().int().min(1).optional(),
  last_date: z.string().optional().nullable(),
  country_id: z.coerce.number().int().positive().optional().nullable(),
  state_id: z.coerce.number().int().positive().optional().nullable(),
  city_id: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().optional().transform(sanitize),
  responsibilities: z.string().optional().transform(sanitize),
  benefits: z.string().optional().transform(sanitize),
  skills: z.array(jobSkillItemSchema).optional()
}).refine((data) => {
  if (data.experience_min != null && data.experience_max != null) {
    return data.experience_max >= data.experience_min;
  }
  return true;
}, {
  message: 'Maximum experience must be greater than or equal to minimum experience',
  path: ['experience_max']
}).refine((data) => {
  if (data.salary_min != null && data.salary_max != null) {
    return data.salary_max >= data.salary_min;
  }
  return true;
}, {
  message: 'Maximum salary must be greater than or equal to minimum salary',
  path: ['salary_max']
});

const updateJobStatusSchema = z.object({
  status: z.enum(['open', 'on_hold', 'closed'], {
    errorMap: () => ({ message: "Status must be 'open', 'on_hold', or 'closed'" })
  })
});

const assignStaffSchema = z.object({
  assigned_to: z.coerce.number().int().positive('Valid staff user ID is required')
});

module.exports = {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
  assignStaffSchema
};
