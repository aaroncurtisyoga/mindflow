import { getTodosByCategory } from "@/lib/actions/todo.actions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TodoList } from "@/components/todos/TodoList";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category) notFound();

  const todos = await getTodosByCategory(categoryId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <h1 className="text-xl font-semibold tracking-tight">{category.name}</h1>
        <span className="text-sm text-muted-foreground">
          {todos.filter((t) => !t.completed).length} items
        </span>
      </div>
      <TodoList todos={todos} categoryId={categoryId} />
    </div>
  );
}
