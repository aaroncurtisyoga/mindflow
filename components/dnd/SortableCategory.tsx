"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { GripVertical } from "lucide-react";
import { CategoryItem } from "@/components/categories/CategoryItem";
import { cn } from "@/lib/utils";
import type { Category } from "@prisma/client";

type CategoryWithCount = Category & { _count: { items: number } };

export function SortableCategory({
  category,
  index,
  isActive,
}: {
  category: CategoryWithCount;
  index: number;
  isActive: boolean;
}) {
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({
    id: category.id,
    index,
    data: { type: "category", category },
  });

  return (
    <div
      ref={ref}
      className={cn(
        "group/sort flex items-center",
        isDragging && "opacity-50",
        isDropTarget && "border-t-2 border-primary"
      )}
    >
      <div
        ref={handleRef}
        className="flex h-4 w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 md:opacity-0 transition-opacity md:group-hover/sort:opacity-100 active:cursor-grabbing ml-1"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <CategoryItem category={category} isActive={isActive} />
      </div>
    </div>
  );
}
