import { NextRequest } from "next/server";
import { signToken } from "@/lib/mcp/oauth";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const responseType = params.get("response_type");
  const clientId = params.get("client_id");
  const redirectUri = params.get("redirect_uri");
  const state = params.get("state");
  const codeChallenge = params.get("code_challenge");
  const codeChallengeMethod = params.get("code_challenge_method");

  if (responseType !== "code") {
    return new Response("unsupported_response_type", { status: 400 });
  }

  if (!clientId || clientId !== process.env.MCP_CLIENT_ID) {
    return new Response("invalid_client", { status: 400 });
  }

  if (!redirectUri || !codeChallenge) {
    return new Response("invalid_request", { status: 400 });
  }

  if (codeChallengeMethod && codeChallengeMethod !== "S256") {
    return new Response("unsupported code_challenge_method", { status: 400 });
  }

  const code = signToken({
    type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  const redirect = new URL(redirectUri);
  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);

  return Response.redirect(redirect.toString(), 302);
}
