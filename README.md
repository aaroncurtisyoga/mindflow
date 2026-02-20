# Mindflow

AI-powered todo app with nested categories, drag-and-drop, and Claude AI integration via MCP server.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Prisma 7 + Supabase Postgres
- Auth.js v5 (single-user, password auth)
- Supabase Realtime for cross-client sync
- MCP server for Claude Desktop / Claude Code

## Getting Started

Copy `.env.example` to `.env` and fill in your values, then:

```bash
yarn install
```

```bash
yarn db:push
```

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
yarn dev
```

```bash
yarn build
```

```bash
yarn db:migrate
```

```bash
yarn db:push
```

```bash
yarn db:studio
```

## MCP Server

The MCP server lives in `packages/mcp-server/` and connects directly to the same Supabase Postgres database. Writes from Claude automatically sync to the UI via Supabase Realtime.
