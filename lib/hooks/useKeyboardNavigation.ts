"use client";

import { useCallback, useEffect, useRef } from "react";

interface KeyboardNavigationOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  onToggleComplete?: (todoId: string) => void;
  onDelete?: (todoId: string) => void;
  onEdit?: (todoId: string) => void;
  onCyclePriority?: (todoId: string) => void;
  onOpenDatePicker?: (todoId: string) => void;
  onShowHelp?: () => void;
  enabled?: boolean;
}

function getTodoItems(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-todo-id]"));
}

function getFocusedTodoId(): string | null {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.dataset.todoId) {
    return active.dataset.todoId;
  }
  return null;
}

export function useKeyboardNavigation({
  containerRef,
  onToggleComplete,
  onDelete,
  onEdit,
  onCyclePriority,
  onOpenDatePicker,
  onShowHelp,
  enabled = true,
}: KeyboardNavigationOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || !containerRef.current) return;

      // Don't capture if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const items = getTodoItems(containerRef.current);
      if (items.length === 0) return;

      const focusedId = getFocusedTodoId();
      const currentIndex = focusedId
        ? items.findIndex((el) => el.dataset.todoId === focusedId)
        : -1;

      // Only capture navigation keys when focus is inside the container (or no specific element is focused)
      const focusInsideContainer = containerRef.current?.contains(document.activeElement) ||
        document.activeElement === document.body;

      switch (e.key) {
        case "ArrowDown":
        case "j": {
          if (!focusInsideContainer && currentIndex === -1) break;
          e.preventDefault();
          const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          items[nextIndex].focus();
          break;
        }
        case "ArrowUp":
        case "k": {
          if (!focusInsideContainer && currentIndex === -1) break;
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          items[prevIndex].focus();
          break;
        }
        case " ": {
          if (focusedId && onToggleComplete) {
            e.preventDefault();
            onToggleComplete(focusedId);
          }
          break;
        }
        case "Enter": {
          if (focusedId && onEdit) {
            e.preventDefault();
            onEdit(focusedId);
          }
          break;
        }
        case "Delete":
        case "Backspace": {
          if (focusedId && onDelete) {
            e.preventDefault();
            onDelete(focusedId);
          }
          break;
        }
        case "p": {
          if (focusedId && onCyclePriority) {
            e.preventDefault();
            onCyclePriority(focusedId);
          }
          break;
        }
        case "d": {
          if (focusedId && onOpenDatePicker) {
            e.preventDefault();
            onOpenDatePicker(focusedId);
          }
          break;
        }
        case "?": {
          e.preventDefault();
          onShowHelp?.();
          break;
        }
      }
    },
    [enabled, containerRef, onToggleComplete, onDelete, onEdit, onCyclePriority, onOpenDatePicker, onShowHelp]
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}
