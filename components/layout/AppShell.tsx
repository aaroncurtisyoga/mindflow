"use client";

import { useRef, useState, useEffect } from "react";
import { PanelLeft } from "lucide-react";
import { CategorySidebar } from "@/components/categories/CategorySidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { MobileSidebarProvider, useMobileSidebar } from "@/lib/contexts/MobileSidebarContext";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "radix-ui";
import { cn } from "@/lib/utils";
import type { PanelImperativeHandle } from "react-resizable-panels";
import type { Category } from "@prisma/client";

type CategoryWithCount = Category & { _count: { items: number } };

interface ViewCounts {
  overdue: number;
  upcoming: number;
  highPriority: number;
}

const MOBILE_BREAKPOINT = 768;

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
  const sidebarRef = useRef<PanelImperativeHandle>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Track mobile vs desktop after mount to avoid SSR mismatch
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", check);
    return () => mql.removeEventListener("change", check);
  }, []);

  function toggleSidebar() {
    if (sidebarRef.current?.isCollapsed()) {
      sidebarRef.current.expand();
    } else {
      sidebarRef.current?.collapse();
    }
  }

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

      {/* SSR/initial render: CSS-only layout that won't break */}
      {isMobile === null && (
        <div className="flex h-full">
          <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:block">
            <CategorySidebar categories={categories} todayCount={todayCount} viewCounts={viewCounts} />
          </aside>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      )}

      {/* Mobile: simple full-width layout */}
      {isMobile === true && (
        <main className="h-full overflow-hidden">{children}</main>
      )}

      {/* Desktop: resizable panels (only after we know viewport) */}
      {isMobile === false && (
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          <ResizablePanel
            panelRef={sidebarRef}
            defaultSize={20}
            minSize={12}
            maxSize={35}
            collapsible
            collapsedSize={0}
            onResize={(size) => setCollapsed(size.asPercentage === 0)}
            className={cn("bg-sidebar", collapsed && "hidden")}
          >
            <CategorySidebar categories={categories} todayCount={todayCount} viewCounts={viewCounts} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={80}>
            <div className="flex h-full flex-col">
              {collapsed && (
                <div className="flex items-center border-b border-border px-2 py-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleSidebar}
                    title="Show sidebar"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
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
