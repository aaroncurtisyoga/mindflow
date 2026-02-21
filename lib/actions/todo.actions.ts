"use server";

import { prisma } from "@/lib/prisma";
import { Priority } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getTodosByCategory(categoryId: string) {
  return prisma.todoItem.findMany({
    where: { categoryId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getTodoByShortId(shortId: number) {
  return prisma.todoItem.findUnique({
    where: { shortId },
    include: { category: true, subtasks: true },
  });
}

export async function createTodo(data: {
  title: string;
  categoryId: string;
  parentId?: string;
  priority?: Priority;
  dueDate?: Date;
  depth?: number;
  description?: string;
  completed?: boolean;
}) {
  const maxOrder = await prisma.todoItem.aggregate({
    where: { categoryId: data.categoryId },
    _max: { sortOrder: true },
  });
  const todo = await prisma.todoItem.create({
    data: {
      title: data.title,
      categoryId: data.categoryId,
      parentId: data.parentId,
      priority: data.priority ?? "NONE",
      dueDate: data.dueDate,
      depth: data.depth ?? 0,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      description: data.description,
      completed: data.completed ?? false,
    },
  });
  revalidatePath("/");
  return todo;
}

export async function updateTodo(
  id: string,
  data: {
    title?: string;
    description?: string;
    completed?: boolean;
    priority?: Priority;
    dueDate?: Date | null;
    depth?: number;
    parentId?: string | null;
    googleCalendarEventId?: string | null;
    googleDriveFileIds?: string[];
  }
) {
  const todo = await prisma.todoItem.update({
    where: { id },
    data,
  });
  revalidatePath("/");
  return todo;
}

export async function toggleTodo(id: string) {
  const current = await prisma.todoItem.findUniqueOrThrow({ where: { id } });
  const todo = await prisma.todoItem.update({
    where: { id },
    data: { completed: !current.completed },
  });
  revalidatePath("/");
  return todo;
}

export async function deleteTodo(id: string) {
  await prisma.todoItem.delete({ where: { id } });
  revalidatePath("/");
}

export async function searchTodos(query: string) {
  return prisma.todoItem.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { category: true },
    take: 20,
  });
}

export type ViewFilter = "overdue" | "upcoming" | "high-priority";

export async function getFilteredTodos(filter: ViewFilter) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "overdue":
      return prisma.todoItem.findMany({
        where: {
          completed: false,
          dueDate: { lt: startOfDay },
        },
        include: { category: true },
        orderBy: { dueDate: "asc" },
      });
    case "upcoming": {
      const endOfWeek = new Date(startOfDay);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      return prisma.todoItem.findMany({
        where: {
          completed: false,
          dueDate: { gte: startOfDay, lt: endOfWeek },
        },
        include: { category: true },
        orderBy: { dueDate: "asc" },
      });
    }
    case "high-priority":
      return prisma.todoItem.findMany({
        where: {
          completed: false,
          priority: "HIGH",
        },
        include: { category: true },
        orderBy: { sortOrder: "asc" },
      });
  }
}

export async function getViewCounts() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(startOfDay);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [overdue, upcoming, highPriority] = await Promise.all([
    prisma.todoItem.count({
      where: { completed: false, dueDate: { lt: startOfDay } },
    }),
    prisma.todoItem.count({
      where: { completed: false, dueDate: { gte: startOfDay, lt: endOfWeek } },
    }),
    prisma.todoItem.count({
      where: { completed: false, priority: "HIGH" },
    }),
  ]);

  return { overdue, upcoming, highPriority };
}
