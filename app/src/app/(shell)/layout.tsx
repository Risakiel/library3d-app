import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { AUTH_COOKIE, isValidAuthToken } from "@/lib/auth";

export default function ShellLayout({ children }: { children: ReactNode }) {
  const isAdmin = isValidAuthToken(cookies().get(AUTH_COOKIE)?.value);

  return (
    <div className={`flex min-h-screen bg-background text-foreground ${isAdmin ? "dark" : ""}`}>
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col">
        <Topbar isAdmin={isAdmin} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
