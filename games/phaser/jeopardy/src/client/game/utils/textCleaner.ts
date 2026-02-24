const textarea = document.createElement('textarea');

/**
 * Decode HTML entities using the browser's built-in HTML parser.
 * Handles all named, numeric decimal, and numeric hex entities,
 * plus double-encoded entities (e.g. &amp;amp; → &).
 * Also fixes corrupted ampersand sequences from old cache data
 * where `&amp;` got mangled into garbled Unicode + `mp;`.
 */
export function decodeHtmlEntities(text: string): string {
  // Fix corrupted ampersands from old cache entries
  let decoded = text.replace(/[^\x00-\x7F]{1,3}mp;/g, '&');

  for (let i = 0; i < 3; i++) {
    textarea.innerHTML = decoded;
    const pass = textarea.value;
    if (pass === decoded) break;
    decoded = pass;
  }
  return decoded;
}
