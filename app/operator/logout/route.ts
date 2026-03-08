import { NextResponse } from "next/server";
import { clearOperatorAuth } from "@/lib/operator-auth";

async function logout(request: Request) {
  await clearOperatorAuth();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/operator", url.origin), 303);
}

export async function GET(request: Request) {
  return logout(request);
}

export async function POST(request: Request) {
  return logout(request);
}
