"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { CategorySidebar } from "@/components/categories/CategorySidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import type { Category } from "@prisma/client";

type CategoryWithCount = Category & { _count: { items: number } };

export function AppShell({
  categories,
  children,
}: {
  categories: CategoryWithCount[];
  children: React.ReactNode;
}) {
  useRealtimeSync();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35} className="bg-sidebar">
          <CategorySidebar categories={categories} />
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border" />
        <ResizablePanel defaultSize={80}>
          <main className="h-full overflow-auto">{children}</main>
        </ResizablePanel>
      </ResizablePanelGroup>
      <CommandPalette categories={categories} />
    </div>
  );
}
