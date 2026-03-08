import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "operator_auth";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function createToken(value: string): string {
  const secret = process.env.OPERATOR_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(value).digest("hex");
}

function expectedToken(): string {
  const password = process.env.OPERATOR_PASSWORD;
  if (!password) return "";
  return createToken(password);
}

export function isOperatorConfigured(): boolean {
  return Boolean(process.env.OPERATOR_PASSWORD && process.env.OPERATOR_SECRET);
}

export function isValidOperatorPassword(candidate: string): boolean {
  const token = expectedToken();
  const candidateToken = createToken(candidate);

  if (!token || !candidateToken || candidateToken.length !== token.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(candidateToken, "hex"),
      Buffer.from(token, "hex")
    );
  } catch {
    return false;
  }
}

export async function isOperatorAuthenticated(): Promise<boolean> {
  const token = expectedToken();
  if (!token) return false;
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookie || cookie.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(cookie, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}

export async function setOperatorAuth(): Promise<void> {
  const token = expectedToken();
  if (!token) return;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    path: "/operator",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  });
}

export async function clearOperatorAuth(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
