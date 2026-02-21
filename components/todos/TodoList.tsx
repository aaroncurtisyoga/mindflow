"use client";

import { useTransition, useOptimistic, useRef, useState, useCallback } from "react";
import { DndProvider } from "@/components/dnd/DndProvider";
import { SortableTodoItem } from "@/components/dnd/SortableTodoItem";
import { CreateTodoInput } from "./CreateTodoInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KeyboardShortcutsHelp } from "@/components/layout/KeyboardShortcutsHelp";
import { useKeyboardNavigation } from "@/lib/hooks/useKeyboardNavigation";
import { reorderTodos } from "@/lib/actions/reorder.actions";
import { toggleTodo, deleteTodo, createTodo, updateTodo } from "@/lib/actions/todo.actions";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import type { TodoItem as TodoItemType, Priority } from "@prisma/client";
type DragEndEvent = { operation: { source: { id: string | number; data: unknown } | null; target: { id: string | number; data: unknown } | null } };

const PRIORITY_ORDER: Priority[] = ["NONE", "LOW", "MEDIUM", "HIGH"];

export function TodoList({
  todos,
  categoryId,
}: {
  todos: TodoItemType[];
  categoryId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(todos);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  const activeItems = optimisticTodos.filter((t) => !t.completed);
  const completedItems = optimisticTodos.filter((t) => t.completed);

  const handleToggleComplete = useCallback((todoId: string) => {
    startTransition(async () => {
      await toggleTodo(todoId);
    });
  }, [startTransition]);

  const handleDelete = useCallback((todoId: string) => {
    const todo = optimisticTodos.find((t) => t.id === todoId);
    if (!todo) return;
    const captured = { ...todo };
    startTransition(async () => {
      await deleteTodo(todoId);
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
  }, [optimisticTodos, startTransition]);

  const handleCyclePriority = useCallback((todoId: string) => {
    const todo = optimisticTodos.find((t) => t.id === todoId);
    if (!todo) return;
    const currentIndex = PRIORITY_ORDER.indexOf(todo.priority);
    const nextPriority = PRIORITY_ORDER[(currentIndex + 1) % PRIORITY_ORDER.length];
    startTransition(async () => {
      await updateTodo(todoId, { priority: nextPriority });
    });
  }, [optimisticTodos, startTransition]);

  useKeyboardNavigation({
    containerRef,
    onToggleComplete: handleToggleComplete,
    onDelete: handleDelete,
    onCyclePriority: handleCyclePriority,
    onShowHelp: () => setShowHelp(true),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { source, target } = event.operation;
    if (!source || !target) return;

    const sourceData = source.data as { type: string; todo: TodoItemType };
    const targetData = target.data as { type: string; todo: TodoItemType };
    if (sourceData.type !== "todo" || targetData.type !== "todo") return;

    const oldIndex = activeItems.findIndex((t) => t.id === source.id);
    const newIndex = activeItems.findIndex((t) => t.id === target.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = [...activeItems];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updatedAll = [...reordered, ...completedItems];

    startTransition(async () => {
      setOptimisticTodos(updatedAll);
      await reorderTodos(
        reordered.map((item, index) => ({
          id: item.id,
          sortOrder: index,
          parentId: item.parentId,
          depth: item.depth,
        }))
      );
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DndProvider onDragEnd={handleDragEnd}>
        <ScrollArea className="flex-1">
          <div ref={containerRef} className="space-y-0.5 p-2">
            <AnimatePresence mode="popLayout">
              {activeItems.map((todo, index) => (
                <SortableTodoItem key={todo.id} todo={todo} index={index} />
              ))}
            </AnimatePresence>
          </div>

          {completedItems.length > 0 && (
            <div className="border-t border-border p-2">
              <p className="px-4 py-2 text-xs font-medium text-muted-foreground">
                Completed ({completedItems.length})
              </p>
              <div className="space-y-0.5">
                {completedItems.map((todo, index) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    index={activeItems.length + index}
                  />
                ))}
              </div>
            </div>
          )}

          {todos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">No items yet</p>
              <p className="text-sm text-muted-foreground/60">
                Add your first item below
              </p>
            </div>
          )}
        </ScrollArea>
      </DndProvider>

      <div className="border-t border-border p-3">
        <CreateTodoInput categoryId={categoryId} />
      </div>

      <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
