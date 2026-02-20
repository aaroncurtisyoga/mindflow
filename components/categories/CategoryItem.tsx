"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { updateCategory, deleteCategory } from "@/lib/actions/category.actions";
import { cn } from "@/lib/utils";
import type { Category } from "@prisma/client";

type CategoryWithCount = Category & { _count: { items: number } };

export function CategoryItem({
  category,
  isActive,
}: {
  category: CategoryWithCount;
  isActive: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  async function handleRename() {
    if (editName.trim() && editName !== category.name) {
      await updateCategory(category.id, { name: editName.trim() });
    }
    setIsEditing(false);
  }

  async function handleDelete() {
    if (confirm(`Delete "${category.name}" and all its items?`)) {
      await deleteCategory(category.id);
    }
  }

  if (isEditing) {
    return (
      <div className="px-2 py-1">
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") setIsEditing(false);
          }}
          className="h-8 text-sm"
          autoFocus
        />
      </div>
    );
  }

  return (
    <Link
      href={`/category/${category.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-sidebar-foreground hover:bg-accent/50"
      )}
    >
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      <span className="flex-1 truncate">{category.name}</span>
      <span className="text-xs text-muted-foreground">{category._count.items}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
}
