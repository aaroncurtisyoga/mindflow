"use client";

import { useState, useTransition } from "react";
import { GripVertical, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleTodo, updateTodo, deleteTodo, createTodo } from "@/lib/actions/todo.actions";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { DatePicker } from "@/components/todos/DatePicker";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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

const PRIORITY_ORDER: Priority[] = ["NONE", "LOW", "MEDIUM", "HIGH"];

interface TodoItemContentProps {
  todo: TodoItemType;
  showGripHandle?: boolean;
  handleRef?: React.Ref<HTMLElement>;
  showCategoryBadge?: boolean;
  categoryName?: string;
  categoryColor?: string;
  onStartEdit?: () => void;
  isEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}

export function TodoItemContent({
  todo,
  showGripHandle = true,
  handleRef,
  showCategoryBadge = false,
  categoryName,
  categoryColor,
  onStartEdit,
  isEditing: externalIsEditing,
  onEditingChange,
}: TodoItemContentProps) {
  const isMobile = useIsMobile();
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditing = externalIsEditing ?? internalIsEditing;
  const setIsEditing = onEditingChange ?? setInternalIsEditing;
  const [editTitle, setEditTitle] = useState(todo.title);
  const [isPending, startTransition] = useTransition();
  const [justCompleted, setJustCompleted] = useState(false);

  function handleToggle() {
    const wasCompleted = todo.completed;
    if (!wasCompleted && isMobile) {
      try { navigator.vibrate?.(10); } catch {}
    }
    if (!wasCompleted) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
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
    const captured = { ...todo };
    startTransition(async () => {
      await deleteTodo(todo.id);
    });
    toast("Task deleted", {
      description: captured.title,
      action: {
        label: "Undo",
        onClick: () => {
          createTodo({
            title: captured.title,
            categoryId: captured.categoryId,
            parentId: captured.parentId ?? undefined,
            priority: captured.priority,
            dueDate: captured.dueDate ?? undefined,
            depth: captured.depth,
          });
        },
      },
      duration: 5000,
    });
  }

  function handlePriorityChange(priority: Priority) {
    startTransition(async () => {
      await updateTodo(todo.id, { priority });
    });
  }

  function cyclePriority() {
    const currentIndex = PRIORITY_ORDER.indexOf(todo.priority);
    const nextPriority = PRIORITY_ORDER[(currentIndex + 1) % PRIORITY_ORDER.length];
    handlePriorityChange(nextPriority);
  }

  function handleDateChange(date: Date | null) {
    startTransition(async () => {
      await updateTodo(todo.id, { dueDate: date });
    });
  }

  const timestamp = todo.updatedAt > todo.createdAt ? todo.updatedAt : todo.createdAt;
  const formattedTimestamp = new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const isUpdated = todo.updatedAt > todo.createdAt;

  return (
    <>
      {showGripHandle && (
        <div
          ref={handleRef as React.Ref<HTMLDivElement>}
          className="flex h-4 w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing max-md:hidden"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      <AnimatedCheckbox
        checked={todo.completed}
        onCheckedChange={handleToggle}
        className="shrink-0"
      />

      <span
        className="hidden shrink-0 cursor-pointer font-mono text-xs text-muted-foreground/50 hover:text-muted-foreground md:inline"
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
            "flex-1 cursor-text truncate text-sm transition-all",
            todo.completed && "text-muted-foreground",
            justCompleted && "line-through text-muted-foreground"
          )}
          onClick={isMobile ? () => { setEditTitle(todo.title); setIsEditing(true); } : undefined}
          onDoubleClick={!isMobile ? () => { setEditTitle(todo.title); setIsEditing(true); } : undefined}
        >
          {todo.completed ? (
            <s className="decoration-muted-foreground/50">{todo.title}</s>
          ) : (
            todo.title
          )}
        </span>
      )}

      {showCategoryBadge && categoryName && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: `${categoryColor}20`,
            color: categoryColor,
          }}
        >
          {categoryName}
        </span>
      )}

      {todo.priority !== "NONE" && (
        <button
          onClick={cyclePriority}
          className="h-2 w-2 shrink-0 rounded-full transition-transform hover:scale-150"
          style={{ backgroundColor: PRIORITY_COLORS[todo.priority] }}
          title={`${PRIORITY_LABELS[todo.priority]} priority — click to cycle`}
        />
      )}

      <DatePicker
        date={todo.dueDate}
        onChange={handleDateChange}
      />

      <span
        className="hidden shrink-0 font-mono text-[10px] text-muted-foreground/40 md:inline"
        title={`${isUpdated ? "Updated" : "Created"}: ${new Date(timestamp).toLocaleString()}`}
      >
        {isUpdated ? "edited " : ""}{formattedTimestamp}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 md:opacity-0 transition-opacity md:group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { setEditTitle(todo.title); setIsEditing(true); }}>
            Edit title
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {PRIORITY_ORDER.map((p) => (
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
    </>
  );
}

export { PRIORITY_COLORS, PRIORITY_LABELS, PRIORITY_ORDER };
