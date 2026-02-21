"use client";

import { CategorySidebar } from "@/components/categories/CategorySidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { MobileSidebarProvider, useMobileSidebar } from "@/lib/contexts/MobileSidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
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
  const isMobile = useIsMobile();

  return (
    <div className="h-dvh overflow-hidden bg-background">
      {/* Mobile: Sheet drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar" showCloseButton={false}>
          <VisuallyHidden.Root>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden.Root>
          <CategorySidebar categories={categories} todayCount={todayCount} viewCounts={viewCounts} />
        </SheetContent>
      </Sheet>

      {isMobile ? (
        <main className="h-full overflow-auto">{children}</main>
      ) : (
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={12} maxSize={35} className="bg-sidebar">
            <CategorySidebar categories={categories} todayCount={todayCount} viewCounts={viewCounts} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={80}>
            <main className="h-full overflow-auto">{children}</main>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

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
