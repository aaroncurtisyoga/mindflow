import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const maxDuration = 60;

type ActionType = "break_down" | "suggest_priority" | "schedule" | "draft_email";

export async function POST(request: Request) {
  const { todoId, action } = (await request.json()) as {
    todoId: string;
    action: ActionType;
  };

  const todo = await prisma.todoItem.findUnique({
    where: { id: todoId },
    include: { category: true, subtasks: true },
  });

  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  const prompts: Record<ActionType, string> = {
    break_down: `Break down this task into 3-5 specific subtasks. Task: "${todo.title}"${todo.description ? ` (${todo.description})` : ""}. Category: ${todo.category.name}. Return a JSON array of strings, each being a subtask title. Only return the JSON array, nothing else.`,

    suggest_priority: `Given this task: "${todo.title}"${todo.description ? ` (${todo.description})` : ""} in category "${todo.category.name}", suggest a priority level. Return JSON: {"priority": "LOW"|"MEDIUM"|"HIGH", "reason": "brief explanation"}. Only return the JSON.`,

    schedule: `Suggest a due date for this task: "${todo.title}"${todo.description ? ` (${todo.description})` : ""} in category "${todo.category.name}". Today is ${new Date().toISOString().split("T")[0]}. Return JSON: {"date": "YYYY-MM-DD", "reason": "brief explanation"}. Only return the JSON.`,

    draft_email: `Draft a brief email related to this task: "${todo.title}"${todo.description ? ` (${todo.description})` : ""}. Return JSON: {"subject": "...", "body": "..."}. Only return the JSON.`,
  };

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt: prompts[action],
    maxOutputTokens: 500,
  });

  try {
    const parsed = JSON.parse(text);

    // For break_down, auto-create subtasks if it's an array
    if (action === "break_down" && Array.isArray(parsed)) {
      const maxOrder = await prisma.todoItem.aggregate({
        where: { categoryId: todo.categoryId },
        _max: { sortOrder: true },
      });

      const subtasks = await Promise.all(
        parsed.map((title: string, i: number) =>
          prisma.todoItem.create({
            data: {
              title,
              categoryId: todo.categoryId,
              parentId: todo.id,
              depth: todo.depth + 1,
              sortOrder: (maxOrder._max.sortOrder ?? 0) + i + 1,
            },
          })
        )
      );

      return NextResponse.json({
        action,
        result: parsed,
        created: subtasks.map((s) => ({ id: s.id, shortId: s.shortId, title: s.title })),
      });
    }

    return NextResponse.json({ action, result: parsed });
  } catch {
    return NextResponse.json({ action, result: text });
  }
}
