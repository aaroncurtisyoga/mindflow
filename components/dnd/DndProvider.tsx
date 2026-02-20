"use client";

import { DragDropProvider } from "@dnd-kit/react";

interface DndProviderProps {
  children: React.ReactNode;
  onDragEnd?: (event: { operation: { source: { id: UniqueIdentifier; data: unknown } | null; target: { id: UniqueIdentifier; data: unknown } | null } }) => void;
}

type UniqueIdentifier = string | number;

export function DndProvider({ children, onDragEnd }: DndProviderProps) {
  return (
    <DragDropProvider onDragEnd={onDragEnd as any}>
      {children}
    </DragDropProvider>
  );
}
