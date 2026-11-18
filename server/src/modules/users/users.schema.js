const { z } = require('zod');

const userCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  email: z.string().email('Invalid email address format'),
  mobile: z.string().min(8, 'Mobile number is required').max(20).optional(),
  role: z.enum(['admin', 'staff'], {
    errorMap: () => ({ message: "Role must be either 'admin' or 'staff'" })
  }),
  password: z.string().min(8).optional()
});

const userUpdateSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  email: z.string().email().optional(),
  mobile: z.string().min(8).max(20).optional(),
  role: z.enum(['admin', 'staff']).optional()
});

const userStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'blocked'], {
    errorMap: () => ({ message: "Status must be 'active', 'inactive', or 'blocked'" })
  })
});

module.exports = {
  userCreateSchema,
  userUpdateSchema,
  userStatusSchema
};

