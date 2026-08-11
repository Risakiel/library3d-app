"use client";

import { useState } from "react";

export function AdminMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
      >
        A
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-44 rounded-md border border-border bg-card py-1 shadow-lg">
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="w-full px-3 py-2 text-left text-sm text-card-foreground transition-colors hover:bg-accent"
            >
              Se deconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
