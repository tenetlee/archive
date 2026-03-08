"use server";

import { redirect } from "next/navigation";
import {
  isOperatorConfigured,
  isValidOperatorPassword,
  setOperatorAuth,
} from "@/lib/operator-auth";

export async function operatorLogin(formData: FormData) {
  if (!isOperatorConfigured()) {
    return { error: "Operator access is not configured." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !isValidOperatorPassword(password)) {
    return { error: "Invalid password" };
  }

  await setOperatorAuth();
  redirect("/operator");
}
