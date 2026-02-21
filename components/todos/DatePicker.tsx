"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
}

export function DatePicker({ date, onChange, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  function selectAndClose(d: Date | null) {
    onChange(d);
    setOpen(false);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const daysUntilNextMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  nextWeek.setDate(nextWeek.getDate() + daysUntilNextMonday);

  const relativeLabel = date ? formatRelativeDate(date) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 md:h-7 gap-1 px-2 text-sm md:text-xs text-muted-foreground hover:text-foreground",
            date && relativeLabel?.overdue && "text-red-400 hover:text-red-300",
            className
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {relativeLabel ? relativeLabel.label : "Set date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-wrap gap-1 border-b border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 md:h-7 text-sm md:text-xs"
            onClick={() => selectAndClose(today)}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 md:h-7 text-sm md:text-xs"
            onClick={() => selectAndClose(tomorrow)}
          >
            Tomorrow
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 md:h-7 text-sm md:text-xs"
            onClick={() => selectAndClose(nextWeek)}
          >
            Next Week
          </Button>
          {date && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 md:h-7 text-sm md:text-xs text-muted-foreground"
              onClick={() => selectAndClose(null)}
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
        <Calendar
          mode="single"
          selected={date ?? undefined}
          onSelect={(d) => selectAndClose(d ?? null)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
