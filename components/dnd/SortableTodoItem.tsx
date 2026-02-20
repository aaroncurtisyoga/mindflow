"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { GripVertical, Trash2, Calendar, MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleTodo, updateTodo, deleteTodo } from "@/lib/actions/todo.actions";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { TodoItem as TodoItemType, Priority } from "@prisma/client";

const PRIORITY_COLORS: Record<Priority, string> = {
  NONE: "transparent",
  LOW: "#3B82F6",
  MEDIUM: "#F59E0B",
  HIGH: "#EF4444",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  NONE: "None",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export function SortableTodoItem({
  todo,
  index,
}: {
  todo: TodoItemType;
  index: number;
}) {
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({
    id: todo.id,
    index,
    data: { type: "todo", todo },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleTodo(todo.id);
    });
  }

  function handleSaveTitle() {
    if (editTitle.trim() && editTitle !== todo.title) {
      startTransition(async () => {
        await updateTodo(todo.id, { title: editTitle.trim() });
      });
    }
    setIsEditing(false);
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTodo(todo.id);
    });
  }

  function handlePriorityChange(priority: Priority) {
    startTransition(async () => {
      await updateTodo(todo.id, { priority });
    });
  }

  const formattedDate = todo.dueDate
    ? new Date(todo.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <motion.div
      ref={ref}
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-2.5 transition-colors",
        isDragging && "opacity-50 scale-[1.02] shadow-lg",
        isDropTarget && "border-2 border-primary/50 bg-primary/5",
        !isDragging && "hover:bg-accent/50",
        todo.completed && "opacity-60"
      )}
      style={{ paddingLeft: `${todo.depth * 24 + 8}px` }}
    >
      <div
        ref={handleRef}
        className="flex h-4 w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <Checkbox
        checked={todo.completed}
        onCheckedChange={handleToggle}
        className="shrink-0"
      />

      <span
        className="shrink-0 cursor-pointer font-mono text-xs text-muted-foreground/50 hover:text-muted-foreground"
        onClick={() => navigator.clipboard.writeText(`#${todo.shortId}`)}
        title="Click to copy"
      >
        #{todo.shortId}
      </span>

      {isEditing ? (
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveTitle();
            if (e.key === "Escape") {
              setEditTitle(todo.title);
              setIsEditing(false);
            }
          }}
          className="h-7 flex-1 text-sm"
          autoFocus
        />
      ) : (
        <span
          className={cn(
            "flex-1 cursor-text truncate text-sm",
            todo.completed && "line-through text-muted-foreground"
          )}
          onDoubleClick={() => setIsEditing(true)}
        >
          {todo.title}
        </span>
      )}

      {todo.priority !== "NONE" && (
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: PRIORITY_COLORS[todo.priority] }}
          title={PRIORITY_LABELS[todo.priority]}
        />
      )}

      {formattedDate && (
        <span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formattedDate}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            Edit title
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {(["NONE", "LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
            <DropdownMenuItem key={p} onClick={() => handlePriorityChange(p)}>
              <div
                className="mr-2 h-2 w-2 rounded-full"
                style={{ backgroundColor: PRIORITY_COLORS[p] }}
              />
              {PRIORITY_LABELS[p]} priority
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
