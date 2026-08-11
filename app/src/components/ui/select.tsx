import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = "Select";

// Les navigateurs bases sur Chromium/Firefox respectent le style pose directement
// sur <option> pour la liste deroulante ouverte (le <select> seul ne suffit pas).
const SelectOption = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  ({ className, ...props }, ref) => (
    <option ref={ref} className={cn("bg-background text-foreground", className)} {...props} />
  ),
);
SelectOption.displayName = "SelectOption";

export { Select, SelectOption };
