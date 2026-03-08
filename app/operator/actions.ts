"use server";

import { redirect } from "next/navigation";
import {
  clearOperatorLoginFailures,
  isOperatorConfigured,
  isOperatorLoginRateLimited,
  isValidOperatorPassword,
  recordOperatorLoginFailure,
  setOperatorAuth,
} from "@/lib/operator-auth";

export async function operatorLogin(formData: FormData) {
  if (!isOperatorConfigured()) {
    return { error: "Operator access is not configured." };
  }

  if (await isOperatorLoginRateLimited()) {
    return { error: "Too many login attempts. Try again in 15 minutes." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !isValidOperatorPassword(password)) {
    await recordOperatorLoginFailure();
    return { error: "Invalid password" };
  }

  await clearOperatorLoginFailures();
  await setOperatorAuth();
  redirect("/operator");
}
