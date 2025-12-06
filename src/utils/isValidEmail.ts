export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}
