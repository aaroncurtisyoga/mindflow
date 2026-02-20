"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Folder, FileText, Plus, Search } from "lucide-react";
import { searchTodos } from "@/lib/actions/todo.actions";
import type { Category, TodoItem } from "@prisma/client";

type CategoryWithCount = Category & { _count: { items: number } };

export function CommandPalette({ categories }: { categories: CategoryWithCount[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<(TodoItem & { category: Category })[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const results = await searchTodos(query);
        setSearchResults(results as any);
      });
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search categories and items..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Categories">
          {categories.map((cat) => (
            <CommandItem
              key={cat.id}
              onSelect={() => {
                router.push(`/category/${cat.id}`);
                setOpen(false);
              }}
            >
              <div
                className="mr-2 h-3 w-3 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
              <span className="ml-auto text-xs text-muted-foreground">
                {cat._count.items}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        {searchResults.length > 0 && (
          <CommandGroup heading="Items">
            {searchResults.map((todo) => (
              <CommandItem
                key={todo.id}
                onSelect={() => {
                  router.push(`/category/${todo.categoryId}`);
                  setOpen(false);
                }}
              >
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground mr-2">
                  #{todo.shortId}
                </span>
                {todo.title}
                <span className="ml-auto text-xs text-muted-foreground">
                  {todo.category.name}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
