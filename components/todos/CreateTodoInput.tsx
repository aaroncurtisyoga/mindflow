"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createTodo } from "@/lib/actions/todo.actions";

export function CreateTodoInput({ categoryId }: { categoryId: string }) {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await createTodo({ title: title.trim(), categoryId });
      setTitle("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Input
        placeholder="Add a new item..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isPending}
        className="h-9 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
      />
    </form>
  );
}
