const prisma = require('../../config/db');

let sequenceMutex = Promise.resolve();

/**
 * Generates sequential, concurrency-safe job codes in format:
 * JOB-<YYYY>-XXXX (e.g. JOB-2026-0001).
 * Uses process-level lock serialization + atomic database transactions (Ruling 3.2).
 */
function generateJobCode(year = new Date().getFullYear(), maxRetries = 5) {
  return new Promise((resolve, reject) => {
    sequenceMutex = sequenceMutex.then(async () => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const code = await prisma.$transaction(async (tx) => {
            let seq = await tx.job_sequences.findFirst({
              where: { year }
            });

            let nextVal = 1;
            if (!seq) {
              await tx.job_sequences.create({
                data: { year, current_val: 1 }
              });
              nextVal = 1;
            } else {
              nextVal = seq.current_val + 1;
              await tx.job_sequences.update({
                where: { year },
                data: { current_val: nextVal }
              });
            }

            const formattedNumber = String(nextVal).padStart(4, '0');
            return `JOB-${year}-${formattedNumber}`;
          });

          return resolve(code);
        } catch (err) {
          if (attempt === maxRetries) {
            return reject(new Error(`Failed to generate sequential job code after ${maxRetries} attempts: ${err.message}`));
          }
          await new Promise((res) => setTimeout(res, 10 * attempt));
        }
      }
    });
  });
}

module.exports = {
  generateJobCode
};
