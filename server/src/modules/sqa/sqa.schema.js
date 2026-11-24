const { z } = require('zod');

const createLeadSchema = z.preprocess((data) => {
  if (typeof data !== 'object' || data === null) return data;
  return {
    fullName: data.fullName || data.name,
    email: data.email,
    phone: data.phone,
    serviceCategory: data.serviceCategory || data.category || data.pillar || 'Career Roadmap',
    subStream: data.subStream || data.track || data.details || '',
    goals: data.goals || data.message || data.details || null
  };
}, z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(150),
  email: z.string().email('Valid email address is required').max(150),
  phone: z.string().min(7, 'Contact number is required').max(30),
  serviceCategory: z.string().min(2, 'Academic pillar / category is required').max(150),
  subStream: z.string().max(200).optional().nullable(),
  goals: z.string().max(2000).optional().nullable()
}));

const updateLeadStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'ENROLLED'], {
    errorMap: () => ({ message: 'Status must be NEW, CONTACTED, or ENROLLED' })
  })
});

const createApplicationSchema = z.preprocess((data) => {
  if (typeof data !== 'object' || data === null) return data;
  return {
    fullName: data.fullName || data.name,
    email: data.email,
    phone: data.phone,
    serviceCategory: data.serviceCategory || data.category || 'Corporate Internship & placement support',
    targetRole: data.targetRole || data.role || 'Placement Candidate',
    experienceLevel: data.experienceLevel || null,
    resumeUrl: data.resumeUrl || data.resume || null,
    statement: data.statement || data.details || null
  };
}, z.object({
  fullName: z.string().min(2, 'Full name is required').max(150),
  email: z.string().email('Valid email is required').max(150),
  phone: z.string().min(7, 'Phone number is required').max(30),
  serviceCategory: z.string().default('Corporate Internship & placement support'),
  targetRole: z.string().min(2, 'Target specialization or role is required').max(150),
  experienceLevel: z.string().max(50).optional().nullable(),
  resumeUrl: z.string().max(500).optional().nullable(),
  statement: z.string().max(3000).optional().nullable()
}));

const verifyCertificateSchema = z.object({
  code: z.string().min(3, 'Certificate ID is required').max(60)
});

module.exports = {
  createLeadSchema,
  updateLeadStatusSchema,
  createApplicationSchema,
  verifyCertificateSchema
};

