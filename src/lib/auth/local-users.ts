import type { PublicUser, UserRecord } from "@/types/user";
import seedUsers from "@/data/users.json";

const REGISTRY_KEY = "traffic-flow:users-registry";
const SESSION_KEY = "traffic-flow:session";

function readRegistry(): UserRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isUserRecord);
  } catch {
    return [];
  }
}

function isUserRecord(value: unknown): value is UserRecord {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.email === "string" &&
    typeof v.phone === "string" &&
    typeof v.name === "string" &&
    typeof v.password === "string"
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function getAllUsers(): UserRecord[] {
  const seed = seedUsers as UserRecord[];
  const extra = readRegistry();
  const byEmail = new Map<string, UserRecord>();
  for (const u of seed) byEmail.set(normalizeEmail(u.email), u);
  for (const u of extra) byEmail.set(normalizeEmail(u.email), u);
  return [...byEmail.values()];
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const key = normalizeEmail(email);
  return getAllUsers().find((u) => normalizeEmail(u.email) === key);
}

export function findUserByPhone(phone: string): UserRecord | undefined {
  const key = normalizePhone(phone);
  if (!key) return undefined;
  return getAllUsers().find((u) => normalizePhone(u.phone) === key);
}

export function registerUser(input: {
  email: string;
  phone: string;
  name: string;
  password: string;
}): { ok: true; user: PublicUser } | { ok: false; error: string } {
  const email = input.email.trim();
  const phone = normalizePhone(input.phone);
  const name = input.name.trim();

  if (findUserByEmail(email)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  if (findUserByPhone(phone)) {
    return { ok: false, error: "An account with this phone number already exists." };
  }

  const user: UserRecord = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `user-${Date.now()}`,
    email,
    phone,
    name,
    password: input.password,
  };

  const next = [...readRegistry(), user];
  window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(next));

  const { password: _p, ...publicUser } = user;
  return { ok: true, user: publicUser };
}

export function verifyCredentials(
  email: string,
  password: string,
): PublicUser | null {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) return null;
  const { password: _pw, ...publicUser } = user;
  return publicUser;
}

function readSessionRaw(): string | null {
  if (typeof window === "undefined") return null;
  const fromSession = window.sessionStorage.getItem(SESSION_KEY);
  if (fromSession) return fromSession;
  const legacy = window.localStorage.getItem(SESSION_KEY);
  if (legacy) {
    window.sessionStorage.setItem(SESSION_KEY, legacy);
    window.localStorage.removeItem(SESSION_KEY);
    return legacy;
  }
  return null;
}

export function setSession(user: PublicUser) {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.localStorage.removeItem(SESSION_KEY);
}

export function getSession(): PublicUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = readSessionRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const v = parsed as Record<string, unknown>;
    if (
      typeof v.id !== "string" ||
      typeof v.email !== "string" ||
      typeof v.name !== "string" ||
      typeof v.phone !== "string"
    ) {
      return null;
    }
    return { id: v.id, email: v.email, name: v.name, phone: v.phone };
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}
