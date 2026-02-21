"use client";

import { CategorySidebar } from "@/components/categories/CategorySidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { MobileSidebarProvider, useMobileSidebar } from "@/lib/contexts/MobileSidebarContext";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "radix-ui";
import type { Category } from "@prisma/client";

type CategoryWithCount = Category & { _count: { items: number } };

interface ViewCounts {
  overdue: number;
  upcoming: number;
  highPriority: number;
}

function AppShellInner({
  categories,
  todayCount,
  viewCounts,
  children,
}: {
  categories: CategoryWithCount[];
  todayCount: number;
  viewCounts: ViewCounts;
  children: React.ReactNode;
}) {
  useRealtimeSync();
  const { open, setOpen } = useMobileSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:block">
        <CategorySidebar categories={categories} todayCount={todayCount} viewCounts={viewCounts} />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar" showCloseButton={false}>
          <VisuallyHidden.Root>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden.Root>
          <CategorySidebar categories={categories} todayCount={todayCount} viewCounts={viewCounts} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-auto">{children}</main>
      <CommandPalette categories={categories} />
    </div>
  );
}

export function AppShell({
  categories,
  todayCount,
  viewCounts,
  children,
}: {
  categories: CategoryWithCount[];
  todayCount: number;
  viewCounts: ViewCounts;
  children: React.ReactNode;
}) {
  return (
    <MobileSidebarProvider>
      <AppShellInner categories={categories} todayCount={todayCount} viewCounts={viewCounts}>
        {children}
      </AppShellInner>
    </MobileSidebarProvider>
  );
}
