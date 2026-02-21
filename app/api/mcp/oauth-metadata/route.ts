import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/mcp/oauth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, MCP-Protocol-Version",
};

export async function GET(req: NextRequest) {
  const base = getBaseUrl(req);
  return NextResponse.json(
    {
      issuer: base,
      authorization_endpoint: `${base}/api/mcp/authorize`,
      token_endpoint: `${base}/api/mcp/token`,
      response_types_supported: ["code"],
      code_challenge_methods_supported: ["S256"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["client_secret_post"],
      scopes_supported: ["mcp"],
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
