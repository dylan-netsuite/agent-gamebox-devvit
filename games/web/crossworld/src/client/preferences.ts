// UI preferences only. Accepted words and drafts remain server-authoritative.
export function readPreference(name: string): string | null {
  try {
    return sessionStorage.getItem(`crossworld:${name}`);
  } catch {
    return null;
  }
}
export function writePreference(name: string, value: string): void {
  try {
    sessionStorage.setItem(`crossworld:${name}`, value);
  } catch {
    /* Optional storage may be unavailable in embedded browsers. */
  }
}
