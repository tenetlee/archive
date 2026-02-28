"use server";

import { redirect } from "next/navigation";
import { setOperatorAuth } from "@/lib/operator-auth";

export async function operatorLogin(formData: FormData) {
  const password = formData.get("password");
  const expected = process.env.OPERATOR_PASSWORD;
  if (!expected || password !== expected) {
    return { error: "Invalid password" };
  }
  await setOperatorAuth();
  redirect("/operator");
}
