export type FieldResult = { ok: true } | { ok: false; message: string };

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function normalizePhoneDigits(input: string): string {
  return input.replace(/\D/g, "");
}

export function validateEmail(value: string): FieldResult {
  const v = value.trim();
  if (!v) return { ok: false, message: "Email is required." };
  if (v.length > 254) return { ok: false, message: "Email is too long." };
  if (!EMAIL_RE.test(v)) return { ok: false, message: "Enter a valid email address." };
  return { ok: true };
}

export function validatePhone(value: string): FieldResult {
  const digits = normalizePhoneDigits(value);
  if (!digits) return { ok: false, message: "Phone is required." };
  if (digits.length < 10 || digits.length > 15) {
    return { ok: false, message: "Phone must be 10–15 digits." };
  }
  return { ok: true };
}

export function validateName(value: string): FieldResult {
  const v = value.trim();
  if (!v) return { ok: false, message: "Name is required." };
  if (v.length < 2) return { ok: false, message: "Name must be at least 2 characters." };
  if (v.length > 80) return { ok: false, message: "Name must be 80 characters or fewer." };
  return { ok: true };
}

export function validatePasswordSignup(value: string): FieldResult {
  if (!value) return { ok: false, message: "Password is required." };
  if (value.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  if (value.length > 128) {
    return { ok: false, message: "Password must be 128 characters or fewer." };
  }
  if (!/[A-Za-z]/.test(value)) {
    return { ok: false, message: "Password must include at least one letter." };
  }
  if (!/\d/.test(value)) {
    return { ok: false, message: "Password must include at least one number." };
  }
  return { ok: true };
}

export function validatePasswordLogin(value: string): FieldResult {
  if (!value) return { ok: false, message: "Password is required." };
  if (value.length > 128) {
    return { ok: false, message: "Password is too long." };
  }
  return { ok: true };
}
