import { getFilteredTodos, type ViewFilter } from "@/lib/actions/todo.actions";
import { FilteredTodoList } from "@/components/todos/FilteredTodoList";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { notFound } from "next/navigation";
import { AlertTriangle, CalendarDays, Flame } from "lucide-react";

const VIEW_CONFIG: Record<
  string,
  { title: string; filter: ViewFilter; color: string; icon: "overdue" | "upcoming" | "high-priority" }
> = {
  overdue: {
    title: "Overdue",
    filter: "overdue",
    color: "#EF4444",
    icon: "overdue",
  },
  upcoming: {
    title: "Upcoming",
    filter: "upcoming",
    color: "#3B82F6",
    icon: "upcoming",
  },
  "high-priority": {
    title: "High Priority",
    filter: "high-priority",
    color: "#F59E0B",
    icon: "high-priority",
  },
};

const ICONS = {
  overdue: <AlertTriangle className="h-5 w-5 text-red-500" />,
  upcoming: <CalendarDays className="h-5 w-5 text-blue-500" />,
  "high-priority": <Flame className="h-5 w-5 text-amber-500" />,
};

export default async function SmartListPage({
  params,
}: {
  params: Promise<{ viewId: string }>;
}) {
  const { viewId } = await params;
  const config = VIEW_CONFIG[viewId];

  if (!config) notFound();

  const todos = await getFilteredTodos(config.filter);

  const sections = [
    {
      title: config.title,
      color: config.color,
      todos,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <MobileHeader categoryName={config.title} categoryColor={config.color} />
      <div className="hidden items-center gap-3 border-b border-border px-6 py-4 md:flex">
        {ICONS[config.icon]}
        <h1 className="text-xl font-semibold tracking-tight">{config.title}</h1>
        <span className="text-sm text-muted-foreground">
          {todos.length} {todos.length === 1 ? "item" : "items"}
        </span>
      </div>
      <FilteredTodoList sections={sections} />
    </div>
  );
}
