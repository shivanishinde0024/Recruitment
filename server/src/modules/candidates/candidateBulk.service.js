const ExcelJS = require('exceljs');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const prisma = require('../../config/db');
const { UPLOAD_DIR } = require('../../config/env');

/**
 * Bulk imports candidates from Excel (.xlsx) buffer and optional resume archive (.zip).
 * Enforces 200-row batching and row-by-row error reporting (Ruling 3.7 / REQ-CND-05).
 */
async function processBulkCandidateUpload(excelBuffer, zipBuffer = null, currentUser) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(excelBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Spreadsheet contains no worksheets');
  }

  // Extract attached resumes if zip provided
  const zipResumeMap = new Map(); // filename (lowercased) -> buffer
  if (zipBuffer) {
    try {
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();
      for (const entry of entries) {
        if (!entry.isDirectory && entry.entryName) {
          const basename = path.basename(entry.entryName).toLowerCase();
          zipResumeMap.set(basename, entry.getData());
        }
      }
    } catch (err) {
      console.warn('Could not parse resume zip archive:', err.message);
    }
  }

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row
    const values = row.values;
    // exceljs 1-indexed row values
    rows.push({
      rowNumber,
      name: values[1] ? String(values[1]).trim() : '',
      email: values[2] ? String(values[2]).trim().toLowerCase() : '',
      mobile: values[3] ? String(values[3]).trim() : '',
      gender: values[4] ? String(values[4]).trim() : null,
      experience_years: values[5] ? parseFloat(values[5]) : 0,
      current_company: values[6] ? String(values[6]).trim() : null,
      current_designation: values[7] ? String(values[7]).trim() : null,
      current_salary: values[8] ? parseFloat(values[8]) : null,
      expected_salary: values[9] ? parseFloat(values[9]) : null,
      notice_period_days: values[10] ? parseInt(values[10], 10) : 30,
      skills_text: values[11] ? String(values[11]).trim() : '',
      resume_filename: values[12] ? String(values[12]).trim() : ''
    });
  });

  const total_rows = rows.length;
  let imported_count = 0;
  const errors = [];

  // Batch in chunks of 200
  const BATCH_SIZE = 200;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const item of batch) {
      if (!item.name || !item.email || !item.mobile) {
        errors.push({
          row: item.rowNumber,
          email: item.email || 'N/A',
          error: 'Missing required field (Name, Email, or Mobile)'
        });
        continue;
      }

      // Email format check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) {
        errors.push({
          row: item.rowNumber,
          email: item.email,
          error: 'Invalid email address format'
        });
        continue;
      }

      // Duplicate check (Ruling 3.4 / REQ-CND-02)
      const existing = await prisma.candidates.findFirst({
        where: {
          OR: [{ email: item.email }, { mobile: item.mobile }],
          deleted_at: null
        }
      });

      if (existing) {
        errors.push({
          row: item.rowNumber,
          email: item.email,
          error: `Duplicate candidate with email '${item.email}' or mobile '${item.mobile}'`
        });
        continue;
      }

      // Check matching resume in zip archive
      let resume_path = null;
      if (item.resume_filename && zipResumeMap.has(item.resume_filename.toLowerCase())) {
        const fileData = zipResumeMap.get(item.resume_filename.toLowerCase());
        const yearMonth = dayjs().format('YYYY/MM');
        const targetDir = path.join(UPLOAD_DIR, 'resumes', yearMonth);
        fs.mkdirSync(targetDir, { recursive: true });
        const ext = path.extname(item.resume_filename) || '.pdf';
        const safeName = `${uuidv4()}${ext}`;
        resume_path = path.join(targetDir, safeName);
        fs.writeFileSync(resume_path, fileData);
      }

      try {
        await prisma.$transaction(async (tx) => {
          const candidate = await tx.candidates.create({
            data: {
              name: item.name,
              email: item.email,
              mobile: item.mobile,
              gender: item.gender,
              experience_years: item.experience_years || 0,
              current_company: item.current_company,
              current_designation: item.current_designation,
              current_salary: item.current_salary,
              expected_salary: item.expected_salary,
              notice_period_days: item.notice_period_days || 30,
              resume_path,
              uploaded_by: currentUser.id,
              status: 'available'
            }
          });

          // Parse comma-separated skills if present
          if (item.skills_text) {
            const skillNames = item.skills_text.split(',').map((s) => s.trim()).filter(Boolean);
            for (const sName of skillNames) {
              let skill = await tx.skills.findFirst({
                where: { name: sName }
              });
              if (!skill) {
                skill = await tx.skills.create({ data: { name: sName, status: 'active' } });
              }
              await tx.candidate_skills.create({
                data: {
                  candidate_id: candidate.id,
                  skill_id: skill.id,
                  rating: 3
                }
              });
            }
          }
        });

        imported_count++;
      } catch (err) {
        errors.push({
          row: item.rowNumber,
          email: item.email,
          error: `Database insertion error: ${err.message}`
        });
      }
    }
  }

  return {
    total_rows,
    imported_count,
    skipped_count: errors.length,
    errors
  };
}

module.exports = {
  processBulkCandidateUpload
};
