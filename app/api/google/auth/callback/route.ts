import { NextResponse, type NextRequest } from "next/server";
import { saveTokens } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  await saveTokens(code);
  return NextResponse.redirect(new URL("/", request.url));
}
