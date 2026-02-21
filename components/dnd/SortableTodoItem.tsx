"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useTransition, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { TodoItemContent } from "@/components/todos/TodoItemContent";
import { useSwipeGesture } from "@/lib/hooks/useSwipeGesture";
import { toggleTodo, deleteTodo, createTodo } from "@/lib/actions/todo.actions";
import { toast } from "sonner";
import { Check, Trash2 } from "lucide-react";
import type { TodoItem as TodoItemType } from "@prisma/client";

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

  const isMobile = useIsMobile();
  const [isPending, startTransition] = useTransition();
  const itemRef = useRef<HTMLDivElement>(null);

  const handleSwipeRight = useCallback(() => {
    if (isMobile) {
      try { navigator.vibrate?.(10); } catch {}
    }
    startTransition(async () => {
      await toggleTodo(todo.id);
    });
  }, [todo.id, isMobile, startTransition]);

  const handleSwipeLeft = useCallback(() => {
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
  }, [todo, startTransition]);

  const { swipeHandlers, swipeState } = useSwipeGesture({
    onSwipeRight: handleSwipeRight,
    onSwipeLeft: handleSwipeLeft,
    threshold: 80,
    enabled: isMobile,
  });

  const showSwipeRight = swipeState.deltaX > 10;
  const showSwipeLeft = swipeState.deltaX < -10;

  return (
    <motion.div
      ref={ref}
      layout
      exit={{ opacity: 0, x: -40, transition: { duration: 0.3 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative overflow-hidden rounded-md",
        isDragging && "opacity-50 scale-[1.02] shadow-lg",
        isDropTarget && "border-2 border-primary/50 bg-primary/5",
      )}
    >
      {/* Swipe reveal backgrounds */}
      {isMobile && (
        <>
          <div
            className={cn(
              "absolute inset-y-0 left-0 flex items-center px-4 transition-opacity",
              showSwipeRight ? "opacity-100" : "opacity-0"
            )}
            style={{ backgroundColor: "#10B981", width: Math.max(0, swipeState.deltaX) }}
          >
            <Check className="h-5 w-5 text-white" />
          </div>
          <div
            className={cn(
              "absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-opacity",
              showSwipeLeft ? "opacity-100" : "opacity-0"
            )}
            style={{ backgroundColor: "#EF4444", width: Math.max(0, -swipeState.deltaX) }}
          >
            <Trash2 className="h-5 w-5 text-white" />
          </div>
        </>
      )}

      <div
        ref={itemRef}
        tabIndex={0}
        data-todo-id={todo.id}
        className={cn(
          "group relative flex items-center gap-2 rounded-md px-2 py-2.5 transition-colors bg-background",
          !isDragging && "hover:bg-accent/50",
          todo.completed && "opacity-60",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
        )}
        style={{
          paddingLeft: `${todo.depth * (isMobile ? 16 : 24) + 8}px`,
          transform: swipeState.swiping ? `translateX(${swipeState.deltaX}px)` : undefined,
          transition: swipeState.swiping ? "none" : "transform 0.2s ease-out",
        }}
        {...swipeHandlers}
      >
        <TodoItemContent
          todo={todo}
          showGripHandle={true}
          handleRef={handleRef}
        />
      </div>
    </motion.div>
  );
}
