"use client";

import { useTransition, useOptimistic } from "react";
import { DndProvider } from "@/components/dnd/DndProvider";
import { SortableTodoItem } from "@/components/dnd/SortableTodoItem";
import { CreateTodoInput } from "./CreateTodoInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { reorderTodos } from "@/lib/actions/reorder.actions";
import { AnimatePresence } from "framer-motion";
import type { TodoItem as TodoItemType } from "@prisma/client";
type DragEndEvent = { operation: { source: { id: string | number; data: unknown } | null; target: { id: string | number; data: unknown } | null } };

export function TodoList({
  todos,
  categoryId,
}: {
  todos: TodoItemType[];
  categoryId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(todos);

  const activeItems = optimisticTodos.filter((t) => !t.completed);
  const completedItems = optimisticTodos.filter((t) => t.completed);

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
          <div className="space-y-0.5 p-2">
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
    </div>
  );
}
