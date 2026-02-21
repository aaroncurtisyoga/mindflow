import { getTodayTodos } from "@/lib/actions/todo.actions";
import { FilteredTodoList } from "@/components/todos/FilteredTodoList";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sun } from "lucide-react";

export default async function TodayPage() {
  const { overdue, dueToday } = await getTodayTodos();

  const sections = [];

  if (overdue.length > 0) {
    sections.push({
      title: "Overdue",
      color: "#EF4444",
      todos: overdue,
    });
  }

  if (dueToday.length > 0) {
    sections.push({
      title: "Due Today",
      color: "#3B82F6",
      todos: dueToday,
    });
  }

  const totalCount = overdue.length + dueToday.length;

  return (
    <div className="flex h-full flex-col">
      <MobileHeader categoryName="Today" categoryColor="#3B82F6" />
      <div className="hidden items-center gap-3 border-b border-border px-6 py-4 md:flex">
        <Sun className="h-5 w-5 text-yellow-500" />
        <h1 className="text-xl font-semibold tracking-tight">Today</h1>
        <span className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "item" : "items"}
        </span>
      </div>
      <FilteredTodoList sections={sections} />
    </div>
  );
}
