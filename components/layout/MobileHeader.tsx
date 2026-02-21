"use client";

import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileSidebar } from "@/lib/contexts/MobileSidebarContext";

export function MobileHeader({
  categoryName,
  categoryColor,
}: {
  categoryName: string;
  categoryColor: string;
}) {
  const { setOpen } = useMobileSidebar();

  function handleSearch() {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: categoryColor }}
      />
      <h1 className="flex-1 truncate text-lg font-semibold tracking-tight">
        {categoryName}
      </h1>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleSearch}
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}
