"use client";

import { useState, useTransition } from "react";
import { Sparkles, CalendarPlus, Mail, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type ActionType = "break_down" | "suggest_priority" | "schedule" | "draft_email";

const ACTIONS: { type: ActionType; label: string; icon: React.ElementType }[] = [
  { type: "break_down", label: "Break down", icon: Sparkles },
  { type: "suggest_priority", label: "Priority", icon: ArrowUpDown },
  { type: "schedule", label: "Schedule", icon: CalendarPlus },
  { type: "draft_email", label: "Email", icon: Mail },
];

export function QuickActions({ todoId }: { todoId: string }) {
  const [result, setResult] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);

  function handleAction(action: ActionType) {
    setActiveAction(action);
    startTransition(async () => {
      const res = await fetch("/api/ai/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todoId, action }),
      });
      const data = await res.json();
      setResult(data);
      setActiveAction(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {ACTIONS.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => handleAction(type)}
            disabled={isPending}
            className="gap-1.5 text-xs"
          >
            <Icon className="h-3.5 w-3.5" />
            {activeAction === type ? "..." : label}
          </Button>
        ))}
      </div>

      {result && (
        <div className="rounded-md bg-muted p-3 text-sm">
          <pre className="whitespace-pre-wrap font-mono text-xs">
            {typeof result.result === "string"
              ? result.result
              : JSON.stringify(result.result, null, 2)}
          </pre>
          {result.created && (
            <p className="mt-2 text-xs text-muted-foreground">
              Created {result.created.length} subtasks
            </p>
          )}
        </div>
      )}
    </div>
  );
}
