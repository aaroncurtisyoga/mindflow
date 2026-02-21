"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const shortcuts = [
  { keys: ["↑", "k"], description: "Move to previous task" },
  { keys: ["↓", "j"], description: "Move to next task" },
  { keys: ["Space"], description: "Toggle task complete" },
  { keys: ["Enter"], description: "Edit task title" },
  { keys: ["Delete"], description: "Delete task" },
  { keys: ["p"], description: "Cycle priority" },
  { keys: ["d"], description: "Open date picker" },
  { keys: ["?"], description: "Show this help" },
];

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map(({ keys, description }) => (
            <div key={description} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{description}</span>
              <div className="flex items-center gap-1">
                {keys.map((key, i) => (
                  <span key={i}>
                    {i > 0 && <span className="mx-1 text-xs text-muted-foreground/50">/</span>}
                    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
