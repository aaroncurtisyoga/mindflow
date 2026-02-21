"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { GripVertical, Trash2, MoreHorizontal, FileText, Copy, Calendar as CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(todo.description ?? "");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [mobileDateOpen, setMobileDateOpen] = useState(false);

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
            description: captured.description ?? undefined,
            completed: captured.completed,
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

  function handleSaveDescription() {
    const trimmed = editDescription.trim();
    const current = todo.description ?? "";
    if (trimmed !== current) {
      startTransition(async () => {
        await updateTodo(todo.id, { description: trimmed || undefined });
      });
    }
    setIsEditingDescription(false);
  }

  function handleCopyId() {
    navigator.clipboard.writeText(`#${todo.shortId}`);
    toast("Copied", { description: `#${todo.shortId}`, duration: 1500 });
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
          className="flex h-11 w-8 md:h-4 md:w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 md:opacity-0 transition-opacity md:group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      <AnimatedCheckbox
        checked={todo.completed}
        onCheckedChange={handleToggle}
        className="shrink-0 h-6 w-6 md:h-4 md:w-4"
      />

      <div className="flex-1 min-w-0">
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
            className="h-8 md:h-7 flex-1 text-base"
            autoFocus
          />
        ) : (
          <span
            className={cn(
              "block truncate text-base cursor-text transition-all",
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

        {/* Description display */}
        {!isEditing && !isEditingDescription && todo.description && (
          <p
            className="mt-0.5 text-sm text-muted-foreground/70 line-clamp-2 cursor-text"
            onClick={() => { setEditDescription(todo.description ?? ""); setIsEditingDescription(true); }}
          >
            {todo.description}
          </p>
        )}

        {/* Description editor */}
        {isEditingDescription && (
          <Textarea
            ref={descriptionRef}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onBlur={handleSaveDescription}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setEditDescription(todo.description ?? "");
                setIsEditingDescription(false);
              }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSaveDescription();
              }
            }}
            placeholder="Add details..."
            className="mt-1 min-h-[60px] border-none bg-accent/50 text-sm shadow-none focus-visible:ring-0 p-2"
            autoFocus
          />
        )}

      </div>

      {/* Desktop: inline meta */}
      {!isMobile && (
        <>
          {showCategoryBadge && categoryName && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
              }}
            >
              {categoryName}
            </span>
          )}

          {todo.description && (
            <button
              className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground"
              onClick={() => { setEditDescription(todo.description ?? ""); setIsEditingDescription(true); }}
              title="Has notes — click to edit"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          )}

          {todo.priority !== "NONE" && (
            <button
              onClick={cyclePriority}
              className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform hover:scale-150"
              style={{ backgroundColor: PRIORITY_COLORS[todo.priority] }}
              title={`${PRIORITY_LABELS[todo.priority]} priority — click to cycle`}
            />
          )}

          <button
            className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground"
            onClick={handleCopyId}
            title={`Copy #${todo.shortId}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <DatePicker
            date={todo.dueDate}
            onChange={handleDateChange}
          />

          <span
            className="shrink-0 font-mono text-xs text-muted-foreground/40"
            title={`${isUpdated ? "Updated" : "Created"}: ${new Date(timestamp).toLocaleString()}`}
          >
            {isUpdated ? "edited " : ""}{formattedTimestamp}
          </span>
        </>
      )}

      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 md:h-8 md:w-8 shrink-0 md:opacity-0 transition-opacity md:group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyId}>
            <Copy className="mr-2 h-4 w-4" />
            Copy #{todo.shortId}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { setEditTitle(todo.title); setIsEditing(true); }}>
            Edit title
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setEditDescription(todo.description ?? ""); setIsEditingDescription(true); }}>
            <FileText className="mr-2 h-4 w-4" />
            {todo.description ? "Edit notes" : "Add notes"}
          </DropdownMenuItem>
          {isMobile && (
            <DropdownMenuItem onClick={() => setMobileDateOpen(true)}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {todo.dueDate ? formatRelativeDate(todo.dueDate).label : "Set date"}
            </DropdownMenuItem>
          )}
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
          <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete item?</DialogTitle>
            <DialogDescription>
              &ldquo;{todo.title}&rdquo; will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              autoFocus
              onClick={() => {
                setConfirmDelete(false);
                handleDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile date picker dialog */}
      <Dialog open={mobileDateOpen} onOpenChange={setMobileDateOpen}>
        <DialogContent className="max-w-[320px] p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle>Set date</DialogTitle>
            <DialogDescription className="sr-only">Choose a due date</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 px-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const d = new Date(); d.setHours(0,0,0,0);
                handleDateChange(d); setMobileDateOpen(false);
              }}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + 1);
                handleDateChange(d); setMobileDateOpen(false);
              }}
            >
              Tomorrow
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const d = new Date(); d.setHours(0,0,0,0);
                const dow = d.getDay(); d.setDate(d.getDate() + (dow === 0 ? 1 : 8 - dow));
                handleDateChange(d); setMobileDateOpen(false);
              }}
            >
              Next week
            </Button>
            {todo.dueDate && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => { handleDateChange(null); setMobileDateOpen(false); }}
              >
                <X className="mr-1 h-3 w-3" /> Clear
              </Button>
            )}
          </div>
          <Calendar
            mode="single"
            selected={todo.dueDate ?? undefined}
            onSelect={(d) => { handleDateChange(d ?? null); setMobileDateOpen(false); }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export { PRIORITY_COLORS, PRIORITY_LABELS, PRIORITY_ORDER };
