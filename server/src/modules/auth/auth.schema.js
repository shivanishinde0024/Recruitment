const { z } = require('zod');

// Password policy: min 8 chars, 1 uppercase, 1 lowercase, 1 digit
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  password: passwordSchema
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(150),
  mobile: z.string().min(8, 'Mobile number is required').max(20).optional()
});

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
};
