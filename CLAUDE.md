# Mindflow

AI-powered todo app. Single-user, dark-mode-first, with nested categories, drag-and-drop, and deep Claude AI integration via MCP server.

## Stack

- **Next.js 16.1.6** + React 19 + TypeScript (App Router, Turbopack)
- **Tailwind CSS 4** + shadcn/ui (new-york style, 17 components in `components/ui/`)
- **Prisma 7** + Supabase Postgres (`@prisma/adapter-pg`, NOT `datasourceUrl`)
- **Auth.js v5** (Google OAuth provider, single allowed email)
- **@dnd-kit/react 0.3** (React 19 compatible, `useSortable` API)
- **Supabase Realtime** for cross-client sync (MCP writes → UI updates)
- **MCP server** in `packages/mcp-server/` for Claude Desktop/Claude Code
- **Framer Motion** for animations
- **googleapis** for Drive, Calendar, Gmail

## Commands

```bash
npm run dev          # Next.js dev server (Turbopack)
npm run db:migrate   # Prisma migrate dev
npm run db:push      # Prisma db push (no migration file)
npm run db:studio    # Prisma Studio GUI
npx tsc --noEmit     # Type-check (no test suite yet)
```

## Critical Gotchas

### Prisma 7 — NOT like Prisma 5/6
- **No `url` in schema.prisma** — the datasource block has only `provider`, no `url` or `directUrl`
- **Client uses adapter**: `new PrismaClient({ adapter: new PrismaPg(url) })` — see `lib/prisma.ts`
- **Migration URL** goes in `prisma.config.ts` under `datasource.url`, not in schema
- Run `npx prisma generate` after schema changes (postinstall handles this on `npm install`)

### Next.js 16 — `proxy.ts` not `middleware.ts`
- Route protection is in `proxy.ts` at project root (replaces deprecated `middleware.ts`)
- Exports `auth` as default export with a `config.matcher`

### @dnd-kit/react — different API from @dnd-kit/core
- Uses `useSortable` from `@dnd-kit/react/sortable` (not `@dnd-kit/sortable`)
- `DragDropProvider` component (not `DndContext`)
- Event types are inline objects with `{ operation: { source, target } }` — NOT the `DragEndEvent` from `@dnd-kit/dom`
- We define a local `DragEndEvent` type in components that use it

### Zod 4
- This project uses Zod v4 (`zod@^4.3.6`). The MCP server uses Zod v3 (separate package.json).

## Architecture

```
app/(auth)/login/       → Google OAuth login page
app/(app)/              → Authed app shell (layout fetches categories from DB)
  inbox/                → Redirects to first category (or shows empty state)
  category/[categoryId] → Category view with sortable todo list
app/api/
  auth/[...nextauth]    → Auth.js route handler
  ai/action             → AI quick actions (break_down, suggest_priority, schedule, draft_email)
  google/{auth,drive,calendar,email} → Google integration endpoints
```

### Data Flow
1. **Server components** fetch data via Prisma (e.g., `app/(app)/layout.tsx` loads categories)
2. **Server actions** in `lib/actions/` handle mutations (CRUD, reorder) with `revalidatePath("/")`
3. **Supabase Realtime** in `lib/hooks/useRealtimeSync.ts` subscribes to `postgres_changes` on Category/TodoItem tables → calls `router.refresh()` for external writes (MCP, etc.)
4. **Optimistic updates** via React 19 `useOptimistic` for drag-and-drop reordering

### Auth Model
- Single user, Google OAuth. Allowed email in `ALLOWED_EMAIL` env var.
- Auth.js v5 with JWT sessions (no DB sessions).
- `signIn` callback rejects any email that doesn't match `ALLOWED_EMAIL`.
- `proxy.ts` protects all routes except `/login`, `/api/auth/*`, and static assets.

## Database Schema

3 models in `prisma/schema.prisma`:
- **Category** — name, color, icon, sortOrder, collapsed
- **TodoItem** — title, description, completed, priority (enum: NONE/LOW/MEDIUM/HIGH), dueDate, sortOrder, depth, parentId (self-referential for nesting), shortId (auto-increment int shown as `#42`), googleCalendarEventId, googleDriveFileIds[]
- **GoogleOAuthToken** — singleton row for Google OAuth tokens

## Key Files

| File | Purpose |
|------|---------|
| `lib/prisma.ts` | Prisma client singleton (PrismaPg adapter) |
| `lib/auth.ts` + `lib/auth.config.ts` | Auth.js setup |
| `proxy.ts` | Route protection |
| `prisma.config.ts` | Prisma 7 config (migration URL) |
| `lib/actions/*.actions.ts` | Server actions for categories, todos, reorder |
| `lib/hooks/useRealtimeSync.ts` | Supabase Realtime → router.refresh() |
| `lib/google/*.ts` | Google OAuth, Calendar, Drive, Gmail |
| `components/layout/AppShell.tsx` | Main 2-panel layout (resizable sidebar + content) |
| `components/layout/CommandPalette.tsx` | Cmd+K search |
| `components/dnd/SortableTodoItem.tsx` | Drag-and-drop todo with all item UI |
| `components/todos/QuickActions.tsx` | AI action buttons (mobile) |
| `packages/mcp-server/src/index.ts` | MCP server entry (stdio transport) |
| `packages/mcp-server/src/tools.ts` | 10 MCP tools (list, create, update, complete, delete, search, etc.) |

## MCP Server

Standalone in `packages/mcp-server/` with its own `package.json` (Zod v3, separate deps).
Connects directly to the same Supabase Postgres via Prisma. Writes trigger Realtime automatically.

10 tools: `list_categories`, `list_todos`, `get_todo`, `create_todo`, `update_todo`, `complete_todo`, `delete_todo`, `create_category`, `search_todos`, `get_daily_summary`

Short IDs work everywhere — pass `#42` to any tool that accepts an ID.

## Design System

- Dark mode default (`#0A0A0A` background, `#171717` cards, `#262626` elevated)
- Accent blue `#3B82F6`, success `#10B981`, warning `#F59E0B`, danger `#EF4444`
- Geist Sans (body) + Geist Mono (code/timestamps)
- 8px spacing grid, Lucide icons at 16px (`w-4 h-4`)
- Elevation via background color changes, not shadows
- CSS variables defined in `app/globals.css` (`.dark` class, shadcn pattern)

## Env Vars

All documented in `.env.example`. Required: `DATABASE_URL`, `AUTH_SECRET`, `ALLOWED_EMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Optional: Supabase keys (for Realtime), `ANTHROPIC_API_KEY` (for AI actions).
