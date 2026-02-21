import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/prisma";
import type { Priority } from "@prisma/client";

export function registerTools(server: McpServer) {
  server.tool(
    "list_categories",
    "List all categories with item counts",
    {},
    async () => {
      const categories = await prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { items: true } } },
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              categories.map((c) => ({
                id: c.id,
                name: c.name,
                color: c.color,
                itemCount: c._count.items,
              })),
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "list_todos",
    "List todo items in a category, optionally with subtasks",
    {
      categoryId: z.string().describe("Category ID"),
      includeCompleted: z
        .boolean()
        .default(false)
        .describe("Include completed items"),
    },
    async ({ categoryId, includeCompleted }) => {
      const where: Record<string, unknown> = { categoryId };
      if (!includeCompleted) where.completed = false;

      const todos = await prisma.todoItem.findMany({
        where,
        orderBy: { sortOrder: "asc" },
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              todos.map((t) => ({
                id: t.id,
                shortId: `#${t.shortId}`,
                title: t.title,
                description: t.description,
                completed: t.completed,
                priority: t.priority,
                dueDate: t.dueDate?.toISOString(),
                depth: t.depth,
                parentId: t.parentId,
              })),
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "get_todo",
    "Get a specific todo by short ID (e.g. #42) or UUID",
    {
      identifier: z.string().describe("Short ID like '#42' or a UUID"),
    },
    async ({ identifier }) => {
      let todo;
      if (identifier.startsWith("#")) {
        const shortId = parseInt(identifier.slice(1));
        todo = await prisma.todoItem.findUnique({
          where: { shortId },
          include: { category: true, subtasks: true },
        });
      } else {
        todo = await prisma.todoItem.findUnique({
          where: { id: identifier },
          include: { category: true, subtasks: true },
        });
      }
      if (!todo)
        return {
          content: [
            { type: "text" as const, text: JSON.stringify({ error: "Todo not found" }) },
          ],
        };
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                id: todo.id,
                shortId: `#${todo.shortId}`,
                title: todo.title,
                description: todo.description,
                completed: todo.completed,
                priority: todo.priority,
                dueDate: todo.dueDate?.toISOString(),
                category: todo.category.name,
                subtasks: todo.subtasks.map((s) => ({
                  shortId: `#${s.shortId}`,
                  title: s.title,
                  completed: s.completed,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "create_todo",
    "Create a new todo item in a category",
    {
      title: z.string().describe("Todo title"),
      categoryId: z.string().describe("Category ID"),
      description: z.string().optional().describe("Optional description"),
      priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("NONE"),
      dueDate: z.string().optional().describe("Due date in ISO format"),
      parentId: z.string().optional().describe("Parent todo ID for subtask"),
    },
    async (input) => {
      const maxOrder = await prisma.todoItem.aggregate({
        where: { categoryId: input.categoryId },
        _max: { sortOrder: true },
      });

      let depth = 0;
      if (input.parentId) {
        const parent = await prisma.todoItem.findUnique({
          where: { id: input.parentId },
        });
        if (parent) depth = parent.depth + 1;
      }

      const todo = await prisma.todoItem.create({
        data: {
          title: input.title,
          categoryId: input.categoryId,
          description: input.description,
          priority: input.priority as Priority,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          parentId: input.parentId,
          depth,
          sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        },
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { id: todo.id, shortId: `#${todo.shortId}`, title: todo.title },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "update_todo",
    "Update a todo item's title, description, priority, or due date",
    {
      id: z.string().describe("Todo ID or short ID like '#42'"),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).optional(),
      dueDate: z
        .string()
        .nullable()
        .optional()
        .describe("ISO date or null to clear"),
    },
    async (input) => {
      let todoId = input.id;
      if (todoId.startsWith("#")) {
        const found = await prisma.todoItem.findUnique({
          where: { shortId: parseInt(todoId.slice(1)) },
        });
        if (!found)
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ error: "Todo not found" }) },
            ],
          };
        todoId = found.id;
      }

      const data: Record<string, unknown> = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.description !== undefined) data.description = input.description;
      if (input.priority !== undefined) data.priority = input.priority;
      if (input.dueDate === null) data.dueDate = null;
      else if (input.dueDate) data.dueDate = new Date(input.dueDate);

      const todo = await prisma.todoItem.update({
        where: { id: todoId },
        data,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                id: todo.id,
                shortId: `#${todo.shortId}`,
                title: todo.title,
                updated: true,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "complete_todo",
    "Mark a todo item as complete or incomplete",
    {
      id: z.string().describe("Todo ID or short ID like '#42'"),
      completed: z.boolean().default(true),
    },
    async ({ id, completed }) => {
      let todoId = id;
      if (todoId.startsWith("#")) {
        const found = await prisma.todoItem.findUnique({
          where: { shortId: parseInt(todoId.slice(1)) },
        });
        if (!found)
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ error: "Todo not found" }) },
            ],
          };
        todoId = found.id;
      }

      const todo = await prisma.todoItem.update({
        where: { id: todoId },
        data: { completed },
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                shortId: `#${todo.shortId}`,
                title: todo.title,
                completed: todo.completed,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "delete_todo",
    "Delete a todo item",
    {
      id: z.string().describe("Todo ID or short ID like '#42'"),
    },
    async ({ id }) => {
      let todoId = id;
      if (todoId.startsWith("#")) {
        const found = await prisma.todoItem.findUnique({
          where: { shortId: parseInt(todoId.slice(1)) },
        });
        if (!found)
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ error: "Todo not found" }) },
            ],
          };
        todoId = found.id;
      }

      await prisma.todoItem.delete({ where: { id: todoId } });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ deleted: true }),
          },
        ],
      };
    }
  );

  server.tool(
    "create_category",
    "Create a new category",
    {
      name: z.string().describe("Category name"),
      color: z.string().default("#3B82F6").describe("Hex color"),
    },
    async ({ name, color }) => {
      const maxOrder = await prisma.category.aggregate({
        _max: { sortOrder: true },
      });
      const category = await prisma.category.create({
        data: { name, color, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { id: category.id, name: category.name },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "search_todos",
    "Search todos across all categories",
    {
      query: z.string().describe("Search query"),
    },
    async ({ query }) => {
      const todos = await prisma.todoItem.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { category: true },
        take: 20,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              todos.map((t) => ({
                shortId: `#${t.shortId}`,
                title: t.title,
                category: t.category.name,
                completed: t.completed,
                priority: t.priority,
              })),
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "get_daily_summary",
    "Get a summary of today's priorities across all categories",
    {},
    async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [allActive, dueToday, highPriority, categories] =
        await Promise.all([
          prisma.todoItem.count({ where: { completed: false } }),
          prisma.todoItem.findMany({
            where: {
              completed: false,
              dueDate: { gte: today, lt: tomorrow },
            },
            include: { category: true },
          }),
          prisma.todoItem.findMany({
            where: { completed: false, priority: "HIGH" },
            include: { category: true },
          }),
          prisma.category.findMany({
            include: {
              _count: {
                select: { items: { where: { completed: false } } },
              },
            },
          }),
        ]);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                totalActive: allActive,
                dueToday: dueToday.map((t) => ({
                  shortId: `#${t.shortId}`,
                  title: t.title,
                  category: t.category.name,
                })),
                highPriority: highPriority.map((t) => ({
                  shortId: `#${t.shortId}`,
                  title: t.title,
                  category: t.category.name,
                })),
                categorySummary: categories.map((c) => ({
                  name: c.name,
                  activeItems: c._count.items,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
