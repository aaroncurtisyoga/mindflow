import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { toolDefinitions } from "./tools.js";

const server = new McpServer({
  name: "mindflow",
  version: "0.1.0",
});

// Register all tools
for (const [name, tool] of Object.entries(toolDefinitions)) {
  server.tool(
    name,
    tool.description,
    tool.parameters.shape as any,
    async (params: any) => {
      try {
        const result = await tool.handler(params as any);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mindflow MCP server running on stdio");
}

main().catch(console.error);
