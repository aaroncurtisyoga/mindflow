"use client";

import { useState, useTransition } from "react";
import { Plus, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTodo } from "@/lib/actions/todo.actions";

export function CreateTodoInput({ categoryId }: { categoryId: string }) {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await createTodo({ title: title.trim(), categoryId });
      setTitle("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Plus className="h-5 w-5 md:h-4 md:w-4 shrink-0 text-muted-foreground" />
      <Input
        placeholder="Add a new item..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isPending}
        className="h-11 md:h-10 border-none bg-transparent text-base shadow-none focus-visible:ring-0"
      />
      {title.trim() && (
        <Button
          type="submit"
          size="icon"
          disabled={isPending}
          className="h-9 w-9 md:h-7 md:w-7 shrink-0 rounded-full"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
