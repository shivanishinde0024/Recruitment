const { z } = require('zod');

const masterCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  isActive: z.boolean().optional().default(true),
  parentId: z.coerce.number().int().positive().optional(),
  minYears: z.coerce.number().min(0).optional(),
  maxYears: z.coerce.number().min(0).optional(),
  isoCode: z.string().max(3).optional()
});

const masterUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150).optional(),
  isActive: z.boolean().optional(),
  parentId: z.coerce.number().int().positive().optional(),
  minYears: z.coerce.number().min(0).optional(),
  maxYears: z.coerce.number().min(0).optional(),
  isoCode: z.string().max(3).optional()
});

module.exports = {
  masterCreateSchema,
  masterUpdateSchema
};
