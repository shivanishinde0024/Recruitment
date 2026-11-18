const { z } = require('zod');

const candidateSkillSchema = z.object({
  skill_id: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5).default(3)
});

const createCandidateSchema = z.object({
  name: z.string().min(2, 'Candidate name is required').max(150),
  email: z.string().email('Invalid email address format'),
  mobile: z.string().min(8, 'Mobile number is required').max(20),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  dob: z.string().optional().nullable(),
  qualification_id: z.coerce.number().int().positive().optional().nullable(),
  experience_years: z.coerce.number().min(0).default(0),
  current_company: z.string().max(200).optional().nullable(),
  current_designation: z.string().max(100).optional().nullable(),
  current_salary: z.coerce.number().min(0).optional().nullable(),
  expected_salary: z.coerce.number().min(0).optional().nullable(),
  notice_period_days: z.coerce.number().int().min(0).default(30),
  address: z.string().optional().nullable(),
  country_id: z.coerce.number().int().positive().optional().nullable(),
  state_id: z.coerce.number().int().positive().optional().nullable(),
  city_id: z.coerce.number().int().positive().optional().nullable(),
  pincode: z.string().max(12).optional().nullable(),
  source_id: z.coerce.number().int().positive().optional().nullable(),
  skills: z.array(candidateSkillSchema).optional().default([])
});

const updateCandidateSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  email: z.string().email().optional(),
  mobile: z.string().min(8).max(20).optional(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  dob: z.string().optional().nullable(),
  qualification_id: z.coerce.number().int().positive().optional().nullable(),
  experience_years: z.coerce.number().min(0).optional(),
  current_company: z.string().max(200).optional().nullable(),
  current_designation: z.string().max(100).optional().nullable(),
  current_salary: z.coerce.number().min(0).optional().nullable(),
  expected_salary: z.coerce.number().min(0).optional().nullable(),
  notice_period_days: z.coerce.number().int().min(0).optional(),
  address: z.string().optional().nullable(),
  country_id: z.coerce.number().int().positive().optional().nullable(),
  state_id: z.coerce.number().int().positive().optional().nullable(),
  city_id: z.coerce.number().int().positive().optional().nullable(),
  pincode: z.string().max(12).optional().nullable(),
  source_id: z.coerce.number().int().positive().optional().nullable(),
  skills: z.array(candidateSkillSchema).optional()
});

module.exports = {
  createCandidateSchema,
  updateCandidateSchema
};
