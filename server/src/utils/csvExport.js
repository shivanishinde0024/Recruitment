/**
 * CSV / Data Export Utilities with Anti-Formula-Injection Defense
 * Master Prompt §8.4 / Ruling 3.14
 */

const FORMULA_TRIGGER_CHARS = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Sanitize a cell value to prevent formula injection / CSV injection.
 * If the value starts with an executable formula character, prefix it with a single quote.
 *
 * @param {any} val - The input value
 * @returns {string} - Safe string
 */
function sanitizeFormulaCell(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);

  if (str.length > 0 && FORMULA_TRIGGER_CHARS.includes(str.charAt(0))) {
    // Prefix with single quote to force spreadsheet programs to treat as text literal
    return `'${str}`;
  }
  return str;
}

/**
 * Convert an array of row objects into a safe CSV string.
 *
 * @param {Array<Object>} rows - Array of objects
 * @param {Array<{ key: string, label: string }>} columns - Column definitions
 * @returns {string} - CSV output
 */
function generateSafeCsv(rows, columns) {
  const headerLine = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

  const dataLines = rows.map(row => {
    return columns.map(col => {
      const rawVal = row[col.key];
      const sanitized = sanitizeFormulaCell(rawVal);
      return `"${sanitized.replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headerLine, ...dataLines].join('\r\n');
}

module.exports = {
  sanitizeFormulaCell,
  generateSafeCsv
};
