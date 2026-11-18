const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const ApiError = require('../utils/ApiError');
const { UPLOAD_DIR, MAX_RESUME_MB, MAX_DOC_MB } = require('../config/env');

const ALLOWED_CONFIG = {
  resume: {
    exts: ['.pdf', '.doc', '.docx'],
    mimes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxMb: MAX_RESUME_MB || 5
  },
  doc: {
    exts: ['.pdf', '.jpg', '.jpeg', '.png'],
    mimes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxMb: MAX_DOC_MB || 5
  },
  logo: {
    exts: ['.jpg', '.jpeg', '.png', '.webp'],
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    maxMb: 2
  },
  bulk: {
    exts: ['.xlsx', '.zip'],
    mimes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed'
    ],
    maxMb: 50
  }
};

function createUploader(kind) {
  const config = ALLOWED_CONFIG[kind] || ALLOWED_CONFIG.doc;

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const yearMonth = dayjs().format('YYYY/MM');
      const targetDir = path.join(UPLOAD_DIR, `${kind}s`, yearMonth);
      try {
        fs.mkdirSync(targetDir, { recursive: true });
        cb(null, targetDir);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeFilename = `${uuidv4()}${ext}`;
      cb(null, safeFilename);
    }
  });

  return multer({
    storage,
    limits: {
      fileSize: config.maxMb * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!config.exts.includes(ext)) {
        return cb(
          new ApiError(
            400,
            `File type '${ext}' is not permitted for ${kind}. Allowed types: ${config.exts.join(', ')}`
          )
        );
      }
      cb(null, true);
    }
  });
}

// Memory storage for bulk uploads and small file buffers
const memoryUploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

module.exports = {
  createUploader,
  memoryUploader
};
