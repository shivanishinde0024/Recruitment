/**
 * HTML Sanitizer for user-supplied rich text fields.
 * Strips script tags, iframes, on* event handlers, javascript: URIs,
 * and disallowed HTML markup to protect against Stored XSS (Master §8.3).
 */

function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return dirty;

  let clean = dirty;

  // 1. Strip dangerous tags and their enclosed content
  const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'applet', 'meta', 'link', 'form', 'input', 'button', 'svg'];
  for (const tag of dangerousTags) {
    const pairRegex = new RegExp(`<\\s*${tag}[^>]*>[\\s\\S]*?<\\s*\\/\\s*${tag}\\s*>`, 'gi');
    clean = clean.replace(pairRegex, '');
    const selfCloseRegex = new RegExp(`<\\s*${tag}[^>]*\\/?>`, 'gi');
    clean = clean.replace(selfCloseRegex, '');
  }

  // 2. Strip all inline on* event handler attributes (e.g. onerror, onclick, onload)
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 3. Strip javascript: and data: pseudo-protocols in href or src
  clean = clean.replace(/(href|src)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, '$1="#"');
  clean = clean.replace(/(href|src)\s*=\s*(?:'data:[^']*'|"data:[^"]*"|data:[^\s>]+)/gi, '$1="#"');

  return clean.trim();
}

module.exports = {
  sanitizeHtml
};
