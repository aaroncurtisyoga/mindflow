"use client";

import { useRef, useState, useTransition, useCallback } from "react";
import { TodoItemContent } from "@/components/todos/TodoItemContent";
import { useKeyboardNavigation } from "@/lib/hooks/useKeyboardNavigation";
import { KeyboardShortcutsHelp } from "@/components/layout/KeyboardShortcutsHelp";
import { toggleTodo, deleteTodo, createTodo, updateTodo } from "@/lib/actions/todo.actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { TodoItem as TodoItemType, Category, Priority } from "@prisma/client";

type TodoWithCategory = TodoItemType & { category: Category };

interface TodoSection {
  title: string;
  color?: string;
  todos: TodoWithCategory[];
}

interface FilteredTodoListProps {
  sections: TodoSection[];
}

const PRIORITY_ORDER: Priority[] = ["NONE", "LOW", "MEDIUM", "HIGH"];

export function FilteredTodoList({ sections }: FilteredTodoListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggleComplete = useCallback((todoId: string) => {
    startTransition(async () => {
      await toggleTodo(todoId);
    });
  }, [startTransition]);

  const handleDelete = useCallback((todoId: string) => {
    const allTodos = sections.flatMap((s) => s.todos);
    const todo = allTodos.find((t) => t.id === todoId);
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
            description: captured.description ?? undefined,
            completed: captured.completed,
          });
        },
      },
      duration: 5000,
    });
  }, [sections, startTransition]);

  const handleCyclePriority = useCallback((todoId: string) => {
    const allTodos = sections.flatMap((s) => s.todos);
    const todo = allTodos.find((t) => t.id === todoId);
    if (!todo) return;
    const currentIndex = PRIORITY_ORDER.indexOf(todo.priority);
    const nextPriority = PRIORITY_ORDER[(currentIndex + 1) % PRIORITY_ORDER.length];
    startTransition(async () => {
      await updateTodo(todoId, { priority: nextPriority });
    });
  }, [sections, startTransition]);

  useKeyboardNavigation({
    containerRef,
    onToggleComplete: handleToggleComplete,
    onDelete: handleDelete,
    onCyclePriority: handleCyclePriority,
    onShowHelp: () => setShowHelp(true),
  });

  const totalTodos = sections.reduce((acc, s) => acc + s.todos.length, 0);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div ref={containerRef} className="p-2">
          {sections.map((section) => (
            <div key={section.title} className="mb-4">
              <div className="flex items-center gap-2 px-2 py-2">
                {section.color && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                )}
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
                <span className="text-xs text-muted-foreground/60">
                  {section.todos.length}
                </span>
              </div>
              <div className="space-y-0.5">
                <AnimatePresence mode="popLayout">
                  {section.todos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      layout
                      exit={{ opacity: 0, x: -40, transition: { duration: 0.3 } }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      tabIndex={0}
                      data-todo-id={todo.id}
                      className="group flex items-center gap-2 rounded-md px-2 py-2.5 transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
                      style={{ paddingLeft: `${todo.depth * 24 + 8}px` }}
                    >
                      <TodoItemContent
                        todo={todo}
                        showGripHandle={false}
                        showCategoryBadge={true}
                        categoryName={todo.category.name}
                        categoryColor={todo.category.color}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {totalTodos === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">No items to show</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
