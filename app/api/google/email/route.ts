import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/google/gmail";

export async function POST(request: NextRequest) {
  const { to, subject, body } = await request.json();
  const result = await sendEmail({ to, subject, body });
  return NextResponse.json(result);
}
