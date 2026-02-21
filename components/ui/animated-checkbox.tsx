"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCheckboxProps {
  checked: boolean;
  onCheckedChange: () => void;
  className?: string;
}

export function AnimatedCheckbox({
  checked,
  onCheckedChange,
  className,
}: AnimatedCheckboxProps) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={onCheckedChange}
      className={cn(
        "relative flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked && "border-primary bg-primary",
        className
      )}
    >
      <svg
        viewBox="0 0 14 14"
        className="h-3 w-3"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M2.5 7.5L5.5 10.5L11.5 4"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary-foreground"
          initial={false}
          animate={{
            pathLength: checked ? 1 : 0,
            opacity: checked ? 1 : 0,
          }}
          transition={{
            pathLength: { type: "spring", stiffness: 400, damping: 30 },
            opacity: { duration: 0.1 },
          }}
        />
      </svg>
      <motion.div
        className="absolute inset-0 rounded-sm bg-primary"
        initial={false}
        animate={{
          opacity: checked ? 1 : 0,
          scale: checked ? 1 : 0.8,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ zIndex: -1 }}
      />
    </button>
  );
}
