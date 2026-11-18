const path = require('path');
const dotenv = require('dotenv');

// Load environment from server directory or root directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL || 'mysql://portal_user:portal_password@localhost:3306/recruitment';

// Guarantee process.env has DATABASE_URL for Prisma engine
process.env.DATABASE_URL = DATABASE_URL;

const USE_IN_MEMORY_DB = process.env.USE_IN_MEMORY_DB !== undefined 
  ? process.env.USE_IN_MEMORY_DB === 'true' 
  : (NODE_ENV !== 'production');

process.env.USE_IN_MEMORY_DB = String(USE_IN_MEMORY_DB);

module.exports = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  DATABASE_URL,
  USE_IN_MEMORY_DB,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_at_least_64_characters_long_for_security_testing_purpose',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_at_least_64_characters_long_for_security_testing_purpose',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  MAX_FAILED_LOGINS: parseInt(process.env.MAX_FAILED_LOGINS, 10) || 5,
  LOCK_MINUTES: parseInt(process.env.LOCK_MINUTES, 10) || 15,

  SMTP_HOST: process.env.SMTP_HOST || 'smtp.example.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER || 'no-reply@portal.com',
  SMTP_PASS: process.env.SMTP_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || 'Recruitment Portal <no-reply@portal.com>',

  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_RESUME_MB: parseInt(process.env.MAX_RESUME_MB, 10) || 5,
  MAX_DOC_MB: parseInt(process.env.MAX_DOC_MB, 10) || 5,
  ALLOWED_RESUME_TYPES: (process.env.ALLOWED_RESUME_TYPES || 'pdf,doc,docx').split(',')
};
