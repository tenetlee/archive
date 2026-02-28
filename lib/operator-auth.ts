import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "operator_auth";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getToken(): string {
  const secret = process.env.OPERATOR_SECRET;
  const password = process.env.OPERATOR_PASSWORD;
  if (!secret || !password) return "";
  return createHmac("sha256", secret).update(password).digest("hex");
}

export async function isOperatorAuthenticated(): Promise<boolean> {
  const token = getToken();
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
  const token = getToken();
  if (!token) return;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearOperatorAuth(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
