import { z } from "zod";
import { getPrisma } from "./db.js";
import type { Priority } from "@prisma/client";

const prisma = () => getPrisma();

export const toolDefinitions = {
  list_categories: {
    description: "List all categories with item counts",
    parameters: z.object({}),
    handler: async () => {
      const categories = await prisma().category.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { items: true } } },
      });
      return categories.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        itemCount: c._count.items,
      }));
    },
  },

  list_todos: {
    description: "List todo items in a category, optionally with subtasks",
    parameters: z.object({
      categoryId: z.string().describe("Category ID"),
      includeCompleted: z.boolean().default(false).describe("Include completed items"),
    }),
    handler: async ({ categoryId, includeCompleted }: { categoryId: string; includeCompleted: boolean }) => {
      const where: any = { categoryId };
      if (!includeCompleted) where.completed = false;

      const todos = await prisma().todoItem.findMany({
        where,
        orderBy: { sortOrder: "asc" },
      });
      return todos.map((t) => ({
        id: t.id,
        shortId: `#${t.shortId}`,
        title: t.title,
        description: t.description,
        completed: t.completed,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString(),
        depth: t.depth,
        parentId: t.parentId,
      }));
    },
  },

  get_todo: {
    description: "Get a specific todo by short ID (e.g. #42) or UUID",
    parameters: z.object({
      identifier: z.string().describe("Short ID like '#42' or a UUID"),
    }),
    handler: async ({ identifier }: { identifier: string }) => {
      let todo;
      if (identifier.startsWith("#")) {
        const shortId = parseInt(identifier.slice(1));
        todo = await prisma().todoItem.findUnique({
          where: { shortId },
          include: { category: true, subtasks: true },
        });
      } else {
        todo = await prisma().todoItem.findUnique({
          where: { id: identifier },
          include: { category: true, subtasks: true },
        });
      }
      if (!todo) return { error: "Todo not found" };
      return {
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
      };
    },
  },

  create_todo: {
    description: "Create a new todo item in a category",
    parameters: z.object({
      title: z.string().describe("Todo title"),
      categoryId: z.string().describe("Category ID"),
      description: z.string().optional().describe("Optional description"),
      priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("NONE"),
      dueDate: z.string().optional().describe("Due date in ISO format"),
      parentId: z.string().optional().describe("Parent todo ID for subtask"),
    }),
    handler: async (input: {
      title: string;
      categoryId: string;
      description?: string;
      priority: Priority;
      dueDate?: string;
      parentId?: string;
    }) => {
      const maxOrder = await prisma().todoItem.aggregate({
        where: { categoryId: input.categoryId },
        _max: { sortOrder: true },
      });

      let depth = 0;
      if (input.parentId) {
        const parent = await prisma().todoItem.findUnique({ where: { id: input.parentId } });
        if (parent) depth = parent.depth + 1;
      }

      const todo = await prisma().todoItem.create({
        data: {
          title: input.title,
          categoryId: input.categoryId,
          description: input.description,
          priority: input.priority,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          parentId: input.parentId,
          depth,
          sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        },
      });
      return { id: todo.id, shortId: `#${todo.shortId}`, title: todo.title };
    },
  },

  update_todo: {
    description: "Update a todo item's title, description, priority, or due date",
    parameters: z.object({
      id: z.string().describe("Todo ID or short ID like '#42'"),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).optional(),
      dueDate: z.string().nullable().optional().describe("ISO date or null to clear"),
    }),
    handler: async (input: {
      id: string;
      title?: string;
      description?: string;
      priority?: Priority;
      dueDate?: string | null;
    }) => {
      let todoId = input.id;
      if (todoId.startsWith("#")) {
        const found = await prisma().todoItem.findUnique({ where: { shortId: parseInt(todoId.slice(1)) } });
        if (!found) return { error: "Todo not found" };
        todoId = found.id;
      }

      const data: any = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.description !== undefined) data.description = input.description;
      if (input.priority !== undefined) data.priority = input.priority;
      if (input.dueDate === null) data.dueDate = null;
      else if (input.dueDate) data.dueDate = new Date(input.dueDate);

      const todo = await prisma().todoItem.update({ where: { id: todoId }, data });
      return { id: todo.id, shortId: `#${todo.shortId}`, title: todo.title, updated: true };
    },
  },

  complete_todo: {
    description: "Mark a todo item as complete or incomplete",
    parameters: z.object({
      id: z.string().describe("Todo ID or short ID like '#42'"),
      completed: z.boolean().default(true),
    }),
    handler: async ({ id, completed }: { id: string; completed: boolean }) => {
      let todoId = id;
      if (todoId.startsWith("#")) {
        const found = await prisma().todoItem.findUnique({ where: { shortId: parseInt(todoId.slice(1)) } });
        if (!found) return { error: "Todo not found" };
        todoId = found.id;
      }

      const todo = await prisma().todoItem.update({
        where: { id: todoId },
        data: { completed },
      });
      return { shortId: `#${todo.shortId}`, title: todo.title, completed: todo.completed };
    },
  },

  delete_todo: {
    description: "Delete a todo item",
    parameters: z.object({
      id: z.string().describe("Todo ID or short ID like '#42'"),
    }),
    handler: async ({ id }: { id: string }) => {
      let todoId = id;
      if (todoId.startsWith("#")) {
        const found = await prisma().todoItem.findUnique({ where: { shortId: parseInt(todoId.slice(1)) } });
        if (!found) return { error: "Todo not found" };
        todoId = found.id;
      }

      await prisma().todoItem.delete({ where: { id: todoId } });
      return { deleted: true };
    },
  },

  create_category: {
    description: "Create a new category",
    parameters: z.object({
      name: z.string().describe("Category name"),
      color: z.string().default("#3B82F6").describe("Hex color"),
    }),
    handler: async ({ name, color }: { name: string; color: string }) => {
      const maxOrder = await prisma().category.aggregate({ _max: { sortOrder: true } });
      const category = await prisma().category.create({
        data: { name, color, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
      });
      return { id: category.id, name: category.name };
    },
  },

  search_todos: {
    description: "Search todos across all categories",
    parameters: z.object({
      query: z.string().describe("Search query"),
    }),
    handler: async ({ query }: { query: string }) => {
      const todos = await prisma().todoItem.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { category: true },
        take: 20,
      });
      return todos.map((t) => ({
        shortId: `#${t.shortId}`,
        title: t.title,
        category: t.category.name,
        completed: t.completed,
        priority: t.priority,
      }));
    },
  },

  get_daily_summary: {
    description: "Get a summary of today's priorities across all categories",
    parameters: z.object({}),
    handler: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [allActive, dueToday, highPriority, categories] = await Promise.all([
        prisma().todoItem.count({ where: { completed: false } }),
        prisma().todoItem.findMany({
          where: { completed: false, dueDate: { gte: today, lt: tomorrow } },
          include: { category: true },
        }),
        prisma().todoItem.findMany({
          where: { completed: false, priority: "HIGH" },
          include: { category: true },
        }),
        prisma().category.findMany({
          include: { _count: { select: { items: { where: { completed: false } } } } },
        }),
      ]);

      return {
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
      };
    },
  },
};
