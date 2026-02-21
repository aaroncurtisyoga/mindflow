import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not configured");
  return secret;
}

export function signToken(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return null;

  const payload = JSON.parse(Buffer.from(data, "base64url").toString());
  if (payload.exp && Date.now() > payload.exp) return null;

  return payload;
}

export function verifyS256Challenge(
  codeVerifier: string,
  codeChallenge: string
): boolean {
  const computed = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return computed === codeChallenge;
}

export function verifyClient(clientId: string, clientSecret: string): boolean {
  const expectedId = process.env.MCP_CLIENT_ID;
  const expectedSecret = process.env.MCP_CLIENT_SECRET;
  if (!expectedId || !expectedSecret) return false;
  if (clientId.length !== expectedId.length) return false;
  if (clientSecret.length !== expectedSecret.length) return false;

  return (
    crypto.timingSafeEqual(Buffer.from(clientId), Buffer.from(expectedId)) &&
    crypto.timingSafeEqual(
      Buffer.from(clientSecret),
      Buffer.from(expectedSecret)
    )
  );
}

export function getBaseUrl(req: Request): string {
  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}
