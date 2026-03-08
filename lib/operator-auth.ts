import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "operator_auth";
const LOGIN_FAILURE_COOKIE_NAME = "operator_login_failures";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

function createToken(value: string): string {
  const secret = process.env.OPERATOR_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(value).digest("hex");
}

function createRateLimitSignature(payload: string): string {
  const secret = process.env.OPERATOR_SECRET;
  if (!secret) return "";
  return createHmac("sha256", `${secret}:login-rate-limit`)
    .update(payload)
    .digest("base64url");
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
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    path: "/operator",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

function pruneAttempts(timestamps: number[], now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < LOGIN_WINDOW_MS);
}

function decodeLoginFailureCookie(value: string): number[] {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return [];
  }

  const expectedSignature = createRateLimitSignature(payload);
  if (!expectedSignature || expectedSignature.length !== signature.length) {
    return [];
  }

  try {
    const valid = timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );

    if (!valid) {
      return [];
    }

    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (!Array.isArray(decoded)) {
      return [];
    }

    return decoded.filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value) && value > 0
    );
  } catch {
    return [];
  }
}

function encodeLoginFailureCookie(timestamps: number[]): string {
  const payload = Buffer.from(JSON.stringify(timestamps), "utf8").toString(
    "base64url"
  );
  const signature = createRateLimitSignature(payload);
  return `${payload}.${signature}`;
}

async function setLoginFailureCookie(timestamps: number[]): Promise<void> {
  const cookieStore = await cookies();

  if (timestamps.length === 0) {
    cookieStore.set(LOGIN_FAILURE_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/operator",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
    return;
  }

  cookieStore.set(LOGIN_FAILURE_COOKIE_NAME, encodeLoginFailureCookie(timestamps), {
    httpOnly: true,
    path: "/operator",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.ceil(LOGIN_WINDOW_MS / 1000),
  });
}

async function getLoginFailureAttempts(): Promise<number[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOGIN_FAILURE_COOKIE_NAME)?.value;
  return decodeLoginFailureCookie(raw ?? "");
}

export async function isOperatorLoginRateLimited(): Promise<boolean> {
  const now = Date.now();
  const recentAttempts = pruneAttempts(await getLoginFailureAttempts(), now);

  if (recentAttempts.length === 0) {
    await setLoginFailureCookie([]);
    return false;
  }

  await setLoginFailureCookie(recentAttempts);
  return recentAttempts.length >= MAX_LOGIN_ATTEMPTS;
}

export async function recordOperatorLoginFailure(): Promise<void> {
  const now = Date.now();
  const recentAttempts = pruneAttempts(await getLoginFailureAttempts(), now);
  recentAttempts.push(now);
  await setLoginFailureCookie(recentAttempts);
}

export async function clearOperatorLoginFailures(): Promise<void> {
  await setLoginFailureCookie([]);
}

export async function requireOperatorAuthentication(): Promise<void> {
  if (!(await isOperatorAuthenticated())) {
    throw new Error("Operator authentication required.");
  }
}
