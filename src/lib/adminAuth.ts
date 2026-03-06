import crypto from "node:crypto";

export const ADMIN_SESSION_COOKIE = "wx_admin_session";

function getAdminPassword(): string {
  return process.env.ACCESS_CODE_ADMIN_PASSWORD || process.env.ACCESS_CODE_ADMIN_SECRET || "";
}

function buildSessionValue(password: string): string {
  return crypto.createHash("sha256").update(`wx-admin:${password}`).digest("hex");
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";").map((item) => item.trim());
  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) {
      continue;
    }
    return decodeURIComponent(part.slice(name.length + 1));
  }

  return null;
}

export function isAdminRequest(request: Request): boolean {
  const password = getAdminPassword();
  if (!password) {
    return false;
  }

  const headerSecret = request.headers.get("x-admin-secret");
  if (headerSecret && headerSecret === password) {
    return true;
  }

  const cookieHeader = request.headers.get("cookie");
  const sessionCookie = getCookieValue(cookieHeader, ADMIN_SESSION_COOKIE);
  if (!sessionCookie) {
    return false;
  }

  return sessionCookie === buildSessionValue(password);
}

export function verifyAdminPassword(input: string): boolean {
  const password = getAdminPassword();
  if (!password) {
    return false;
  }

  return input === password;
}

export function getAdminSessionToken(): string {
  return buildSessionValue(getAdminPassword());
}

export function hasAdminPasswordConfigured(): boolean {
  return Boolean(getAdminPassword());
}
