import { NextResponse, type NextRequest } from "next/server";
import { searchDriveFiles, getDriveFile } from "@/lib/google/drive";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const fileId = request.nextUrl.searchParams.get("id");

  if (fileId) {
    const file = await getDriveFile(fileId);
    return NextResponse.json(file);
  }

  if (query) {
    const files = await searchDriveFiles(query);
    return NextResponse.json(files);
  }

  return NextResponse.json({ error: "Provide ?q= or ?id=" }, { status: 400 });
}
