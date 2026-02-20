"use client";

import { useState, useTransition, useOptimistic } from "react";
import { usePathname } from "next/navigation";
import { Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DndProvider } from "@/components/dnd/DndProvider";
import { SortableCategory } from "@/components/dnd/SortableCategory";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { reorderCategories } from "@/lib/actions/category.actions";
import { logout } from "@/lib/actions/auth.actions";
import type { Category } from "@prisma/client";
type DragEndEvent = { operation: { source: { id: string | number; data: unknown } | null; target: { id: string | number; data: unknown } | null } };

type CategoryWithCount = Category & { _count: { items: number } };

export function CategorySidebar({ categories }: { categories: CategoryWithCount[] }) {
  const pathname = usePathname();
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
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

      <div className="border-t border-border p-2">
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
