/**
 * Only same-origin, path-only destinations are allowed as post-sign-in redirects.
 * Rejects protocol-relative, backslash, control-character and any other variant
 * that a browser would resolve to a different origin.
 */
export function isSafeLocalPath(value: string): boolean {
  if (!value || value.length > 512) return false;
  // Control characters (including tab/newline) are stripped by browsers and can
  // turn "/\/evil.com" style input into an external origin.
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.includes("\\")) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  try {
    const base = "https://see-see-bloom.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) return false;
    return url.pathname.startsWith("/");
  } catch {
    return false;
  }
}
