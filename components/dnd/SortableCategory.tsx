"use client";

import { useSortable } from "@dnd-kit/react/sortable";
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
  const { ref, isDragging, isDropTarget } = useSortable({
    id: category.id,
    index,
    data: { type: "category", category },
  });

  return (
    <div
      ref={ref}
      className={cn(
        isDragging && "opacity-50",
        isDropTarget && "border-t-2 border-primary"
      )}
    >
      <CategoryItem category={category} isActive={isActive} />
    </div>
  );
}
