import { getFilteredTodos } from "@/lib/actions/todo.actions";
import { FilteredTodoList } from "@/components/todos/FilteredTodoList";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { LayoutDashboard } from "lucide-react";

export default async function OverviewPage() {
  const [overdue, upcoming, highPriority] = await Promise.all([
    getFilteredTodos("overdue"),
    getFilteredTodos("upcoming"),
    getFilteredTodos("high-priority"),
  ]);

  const sections = [];

  if (overdue.length > 0) {
    sections.push({
      title: "Overdue",
      color: "#EF4444",
      todos: overdue,
    });
  }

  if (upcoming.length > 0) {
    sections.push({
      title: "Upcoming",
      color: "#3B82F6",
      todos: upcoming,
    });
  }

  if (highPriority.length > 0) {
    sections.push({
      title: "High Priority",
      color: "#F59E0B",
      todos: highPriority,
    });
  }

  const totalCount = overdue.length + upcoming.length + highPriority.length;

  return (
    <div className="flex h-full flex-col">
      <MobileHeader categoryName="Overview" categoryColor="#3B82F6" />
      <div className="hidden items-center gap-3 border-b border-border px-6 py-4 md:flex">
        <LayoutDashboard className="h-5 w-5 text-blue-500" />
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <span className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "item" : "items"}
        </span>
      </div>
      <FilteredTodoList sections={sections} />
    </div>
  );
}
