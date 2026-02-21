"use client";

import { useState, useTransition, useOptimistic } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, LogOut, AlertTriangle, CalendarDays, Flame, PanelLeftClose, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DndProvider } from "@/components/dnd/DndProvider";
import { SortableCategory } from "@/components/dnd/SortableCategory";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { reorderCategories } from "@/lib/actions/category.actions";
import { logout } from "@/lib/actions/auth.actions";
import { useMobileSidebar } from "@/lib/contexts/MobileSidebarContext";
import { cn } from "@/lib/utils";
import type { Category } from "@prisma/client";
type DragEndEvent = { operation: { source: { id: string | number; data: unknown } | null; target: { id: string | number; data: unknown } | null } };

type CategoryWithCount = Category & { _count: { items: number } };

interface ViewCounts {
  overdue: number;
  upcoming: number;
  highPriority: number;
}

export function CategorySidebar({
  categories,
  viewCounts = { overdue: 0, upcoming: 0, highPriority: 0 },
  onCollapse,
}: {
  categories: CategoryWithCount[];
  viewCounts?: ViewCounts;
  onCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { close } = useMobileSidebar();
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticCategories, setOptimisticCategories] = useOptimistic(categories);

  function handleDragEnd(event: DragEndEvent) {
    const { source, target } = event.operation;
    if (!source || !target) return;

    const oldIndex = optimisticCategories.findIndex((c) => c.id === source.id);
    const newIndex = optimisticCategories.findIndex((c) => c.id === target.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = [...optimisticCategories];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    startTransition(async () => {
      setOptimisticCategories(reordered);
      await reorderCategories(reordered.map((c) => c.id));
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-lg font-semibold tracking-tight">Mindflow</h2>
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={onCollapse}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* Overview */}
        <Link
          href="/overview"
          onClick={close}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 md:py-2 text-base md:text-[15px] transition-colors",
            pathname === "/overview"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4 text-blue-500" />
          <span className="flex-1">Overview</span>
        </Link>

        {/* Smart Views */}
        <div className="mt-4 mb-2">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Views
          </p>
        </div>
        <div className="space-y-0.5">
          <Link
            href="/view/overdue"
            onClick={close}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 md:py-1.5 text-base md:text-[15px] transition-colors",
              pathname === "/view/overdue"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="flex-1">Overdue</span>
            {viewCounts.overdue > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/15 px-1.5 text-xs font-medium text-red-400">
                {viewCounts.overdue}
              </span>
            )}
          </Link>
          <Link
            href="/view/upcoming"
            onClick={close}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 md:py-1.5 text-base md:text-[15px] transition-colors",
              pathname === "/view/upcoming"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <CalendarDays className="h-4 w-4 text-blue-500" />
            <span className="flex-1">Upcoming</span>
            {viewCounts.upcoming > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500/15 px-1.5 text-xs font-medium text-blue-400">
                {viewCounts.upcoming}
              </span>
            )}
          </Link>
          <Link
            href="/view/high-priority"
            onClick={close}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 md:py-1.5 text-base md:text-[15px] transition-colors",
              pathname === "/view/high-priority"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Flame className="h-4 w-4 text-amber-500" />
            <span className="flex-1">High Priority</span>
            {viewCounts.highPriority > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-xs font-medium text-amber-400">
                {viewCounts.highPriority}
              </span>
            )}
          </Link>
        </div>

        {/* Categories */}
        <div className="mt-4 mb-2 flex items-center justify-between px-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Categories
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setCreateOpen(true)}
            title="New category"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <DndProvider onDragEnd={handleDragEnd}>
          <div className="space-y-1">
            {optimisticCategories.map((category, index) => (
              <SortableCategory
                key={category.id}
                category={category}
                index={index}
                isActive={pathname === `/category/${category.id}`}
              />
            ))}
          </div>
        </DndProvider>

        {categories.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No categories yet</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Create one
            </Button>
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-border p-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        <form action={logout}>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>

      <CreateCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
