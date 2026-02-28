import { NextResponse } from "next/server";
import { clearOperatorAuth } from "@/lib/operator-auth";

export async function GET(request: Request) {
  await clearOperatorAuth();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/operator", url.origin));
}
