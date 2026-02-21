"use client"

import { Toaster as Sonner } from "sonner"

function Toaster() {
  return (
    <Sonner
      richColors
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "bg-card text-card-foreground border-border",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
    />
  )
}

export { Toaster }
