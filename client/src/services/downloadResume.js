import api from './api';

/**
 * Extracts a filename from a Content-Disposition header if present.
 */
function parseDispositionFilename(headerValue) {
  if (!headerValue) return null;
  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const plainMatch = headerValue.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || null;
}

/**
 * Downloads a candidate's resume via authenticated API request and triggers a browser file save.
 */
export async function downloadCandidateResume(candidateId, candidateName = 'Candidate') {
  const response = await api.get(`/candidates/${candidateId}/resume`, {
    responseType: 'blob'
  });

  const contentType = response.headers?.['content-type'] || 'application/pdf';
  if (contentType.includes('application/json')) {
    const text = await response.data.text();
    let message = 'Failed to download resume';
    try {
      const parsed = JSON.parse(text);
      if (parsed?.message) message = parsed.message;
    } catch {
      // Ignore JSON parse failure
    }
    throw new Error(message);
  }

  const headerFilename = parseDispositionFilename(response.headers?.['content-disposition']);
  const safeBaseName = (candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = headerFilename || `${safeBaseName}_Resume.pdf`;

  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
