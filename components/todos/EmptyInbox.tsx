"use client";

import { useState } from "react";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateCategoryDialog } from "@/components/categories/CreateCategoryDialog";

export function EmptyInbox() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Welcome to Mindflow</h2>
        <p className="text-sm text-muted-foreground">
          Create your first category to get started
        </p>
      </div>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Category
      </Button>
      <CreateCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
