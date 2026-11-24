const { z } = require('zod');

const companySizeEnum = z.enum([
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+',
  'SIZE_1_10', 'SIZE_11_50', 'SIZE_51_200', 'SIZE_201_500', 'SIZE_501_1000', 'SIZE_1000_PLUS'
]).optional().nullable();

const companyRegisterSchema = z.object({
  // User account credentials
  name: z.string().min(2, 'Name is required').max(150),
  email: z.string().email('Invalid email address format'),
  mobile: z.string().min(8, 'Mobile number is required').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters'),

  // Company profile details
  company_name: z.string().min(2, 'Company name is required').max(200),
  industry_id: z.coerce.number().int().positive().optional(),
  company_type_id: z.coerce.number().int().positive().optional(),
  gst_no: z.string().max(20).optional(),
  pan_no: z.string().max(15).optional(),
  cin_no: z.string().max(25).optional(),
  registration_year: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional(),
  company_size: companySizeEnum,
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.string().optional(),
  country_id: z.coerce.number().int().positive().optional(),
  state_id: z.coerce.number().int().positive().optional(),
  city_id: z.coerce.number().int().positive().optional(),
  pincode: z.string().max(12).optional(),

  // Authorized Contact Person
  contact_person: z.string().min(2, 'Contact person name is required').max(150),
  contact_designation: z.string().max(100).optional(),
  contact_email: z.string().email('Invalid contact email format'),
  contact_mobile: z.string().min(8, 'Contact mobile is required').max(20)
});

const companyVerifySchema = z.object({
  action: z.enum(['approve', 'reject', 'need_info', 'suspend', 'reactivate'], {
    errorMap: () => ({ message: "Action must be 'approve', 'reject', 'need_info', 'suspend', or 'reactivate'" })
  }),
  remark: z.string().optional()
});

const companyUpdateSchema = z.object({
  company_name: z.string().min(2).max(200).optional(),
  industry_id: z.coerce.number().int().positive().optional(),
  company_type_id: z.coerce.number().int().positive().optional(),
  gst_no: z.string().max(20).optional(),
  pan_no: z.string().max(15).optional(),
  cin_no: z.string().max(25).optional(),
  registration_year: z.coerce.number().int().optional(),
  company_size: companySizeEnum,
  website: z.string().optional(),
  address: z.string().optional(),
  country_id: z.coerce.number().int().positive().optional(),
  state_id: z.coerce.number().int().positive().optional(),
  city_id: z.coerce.number().int().positive().optional(),
  pincode: z.string().max(12).optional(),
  contact_person: z.string().min(2).max(150).optional(),
  contact_designation: z.string().max(100).optional(),
  contact_email: z.string().email().optional(),
  contact_mobile: z.string().min(8).max(20).optional()
});

module.exports = {
  companyRegisterSchema,
  companyVerifySchema,
  companyUpdateSchema
};

