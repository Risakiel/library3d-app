import Link from "next/link";
import { AdminMenu } from "@/components/AdminMenu";

interface TopbarProps {
  isAdmin: boolean;
}

export function Topbar({ isAdmin }: TopbarProps) {
  return (
    <header className="flex items-center justify-end border-b border-border bg-card px-8 py-4">
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
