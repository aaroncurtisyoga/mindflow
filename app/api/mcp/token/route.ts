import { NextRequest, NextResponse } from "next/server";
import {
  signToken,
  verifyToken,
  verifyClient,
  verifyS256Challenge,
} from "@/lib/mcp/oauth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const grantType = body.get("grant_type") as string;

  if (grantType === "authorization_code") {
    return handleAuthorizationCode(body);
  }

  if (grantType === "refresh_token") {
    return handleRefreshToken(body);
  }

  return NextResponse.json(
    { error: "unsupported_grant_type" },
    { status: 400, headers: corsHeaders }
  );
}

function handleAuthorizationCode(body: FormData) {
  const code = body.get("code") as string;
  const codeVerifier = body.get("code_verifier") as string;
  const clientId = body.get("client_id") as string;
  const clientSecret = body.get("client_secret") as string;
  const redirectUri = body.get("redirect_uri") as string;

  if (!clientId || !clientSecret || !verifyClient(clientId, clientSecret)) {
    return NextResponse.json(
      { error: "invalid_client" },
      { status: 401, headers: corsHeaders }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "missing code" },
      { status: 400, headers: corsHeaders }
    );
  }

  const payload = verifyToken(code);
  if (!payload || payload.type !== "code") {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "invalid or expired code" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (payload.client_id !== clientId) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "client_id mismatch" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (payload.redirect_uri !== redirectUri) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "redirect_uri mismatch" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (
    !codeVerifier ||
    !verifyS256Challenge(codeVerifier, payload.code_challenge as string)
  ) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "PKCE verification failed" },
      { status: 400, headers: corsHeaders }
    );
  }

  return issueTokens();
}

function handleRefreshToken(body: FormData) {
  const refreshToken = body.get("refresh_token") as string;
  const clientId = body.get("client_id") as string;
  const clientSecret = body.get("client_secret") as string;

  if (!clientId || !clientSecret || !verifyClient(clientId, clientSecret)) {
    return NextResponse.json(
      { error: "invalid_client" },
      { status: 401, headers: corsHeaders }
    );
  }

  if (!refreshToken) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400, headers: corsHeaders }
    );
  }

  const payload = verifyToken(refreshToken);
  if (!payload || payload.type !== "refresh") {
    return NextResponse.json(
      { error: "invalid_grant" },
      { status: 400, headers: corsHeaders }
    );
  }

  return issueTokens();
}

function issueTokens() {
  const accessToken = signToken({
    type: "access",
    exp: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  const refreshToken = signToken({
    type: "refresh",
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: "mcp",
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
