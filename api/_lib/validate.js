// ================================
// VALIDATE
// Input validation/sanitization for the visitor's chat message.
// Hygiene only, not the injection defense -- see prompt.js for that.
// ================================

const MAX_LENGTH = 500;

function validateMessage(body) {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, code: 'invalid_input', message: 'Malformed request.' };
  }

  const { message } = body;

  if (typeof message !== 'string') {
    return { ok: false, code: 'invalid_input', message: 'Please enter a question.' };
  }

  // strip non-printable/control characters, collapse whitespace/newlines
  const cleaned = message
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length === 0) {
    return { ok: false, code: 'invalid_input', message: 'Please enter a question.' };
  }

  if (cleaned.length > MAX_LENGTH) {
    return {
      ok: false,
      code: 'input_too_long',
      message: `Keep questions under ${MAX_LENGTH} characters.`,
    };
  }

  return { ok: true, message: cleaned };
}

module.exports = { validateMessage, MAX_LENGTH };
