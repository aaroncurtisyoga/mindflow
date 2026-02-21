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
  nextWeek.setDate(nextWeek.getDate() + (8 - today.getDay())); // next Monday

  const relativeLabel = date ? formatRelativeDate(date) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 gap-1 px-1.5 text-xs text-muted-foreground hover:text-foreground",
            date && relativeLabel?.overdue && "text-red-400 hover:text-red-300",
            className
          )}
        >
          <CalendarIcon className="h-3 w-3" />
          {relativeLabel ? relativeLabel.label : "Set date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-1 border-b border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => selectAndClose(today)}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => selectAndClose(tomorrow)}
          >
            Tomorrow
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => selectAndClose(nextWeek)}
          >
            Next Week
          </Button>
          {date && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
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
