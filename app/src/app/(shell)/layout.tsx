import type { ReactNode } from "react";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { AUTH_COOKIE, isValidAuthToken } from "@/lib/auth";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const isAdmin = isValidAuthToken(cookies().get(AUTH_COOKIE)?.value);

  const [statuses, marketplaceTags, siteTags, blueTags] = isAdmin
    ? [[], [], [], []]
    : await Promise.all([
        prisma.status.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
        prisma.tag.findMany({
          where: { color: "RED", archived: false },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        prisma.tag.findMany({
          where: { color: "GREEN", archived: false },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        prisma.tag.findMany({
          where: { color: "BLUE", archived: false },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
      ]);

  return (
    <div className={`flex min-h-screen bg-background text-foreground ${isAdmin ? "dark" : ""}`}>
      <Suspense fallback={null}>
        <Sidebar
          isAdmin={isAdmin}
          statuses={statuses}
          marketplaceTags={marketplaceTags}
          siteTags={siteTags}
          blueTags={blueTags}
        />
      </Suspense>
      <div className="flex flex-1 flex-col">
        <Topbar isAdmin={isAdmin} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
