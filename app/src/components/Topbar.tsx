import Link from "next/link";
import { AdminMenu } from "@/components/AdminMenu";

interface TopbarProps {
  isAdmin: boolean;
}

export function Topbar({ isAdmin }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
      {isAdmin ? (
        <div />
      ) : (
        <form action="/" method="get" className="w-full max-w-sm">
          <input
            type="search"
            name="q"
            placeholder="Rechercher un modele..."
            className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </form>
      )}

      {isAdmin ? (
        <AdminMenu />
      ) : (
        <Link
          href="/admin/login"
          className="rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          ADMIN
        </Link>
      )}
    </header>
  );
}
