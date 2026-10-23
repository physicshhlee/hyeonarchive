import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "hyeon_archive_admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;
const SESSION_VALUE = "hyeon-archive-admin-v1";

function signingSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD_HASH;
  if (!secret) throw new Error("관리자 세션 환경 변수가 설정되지 않았습니다.");
  return secret;
}

function signature(expiresAt: string) {
  return createHmac("sha256", signingSecret())
    .update(`${SESSION_VALUE}.${expiresAt}`)
    .digest("hex");
}

export function createAdminSessionToken() {
  const expiresAt = String(Date.now() + ADMIN_SESSION_SECONDS * 1000);
  return `${expiresAt}.${signature(expiresAt)}`;
}

export async function isAdminRequest() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const [expiresAt, given] = token.split(".");
  if (!expiresAt || !given || !(Number(expiresAt) > Date.now())) return false;

  const left = Buffer.from(given);
  const right = Buffer.from(signature(expiresAt));

  return left.length === right.length && timingSafeEqual(left, right);
}
