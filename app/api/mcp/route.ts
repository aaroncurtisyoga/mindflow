import { NextRequest, NextResponse } from "next/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerTools } from "@/lib/mcp/register-tools";
import { verifyToken, getBaseUrl } from "@/lib/mcp/oauth";

function authenticate(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;

  const token = auth.slice(7);
  const payload = verifyToken(token);
  return payload !== null && payload.type === "access";
}

export async function POST(req: NextRequest) {
  if (!authenticate(req)) {
    const base = getBaseUrl(req);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32001, message: "Unauthorized" },
        id: null,
      },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": `Bearer resource_metadata="${base}/api/mcp/resource-metadata"`,
        },
      }
    );
  }

  const server = new McpServer({
    name: "mindflow",
    version: "0.1.0",
  });

  registerTools(server);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  return transport.handleRequest(req as unknown as Request);
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for MCP requests." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed. Stateless mode — no sessions to delete." },
    { status: 405 }
  );
}
