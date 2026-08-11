import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getLogs() {
  return prisma.scanLog.findMany({ orderBy: { startedAt: "desc" }, take: 50 });
}

function formatDuration(startedAt: Date, finishedAt: Date | null) {
  if (!finishedAt) return "en cours...";
  const seconds = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
  return `${seconds}s`;
}

export default async function JournalPage() {
  const logs = await getLogs();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Journal</h1>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {logs.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Aucun scan effectue pour le moment.</p>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 p-3 text-sm">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  !log.finishedAt
                    ? "bg-muted-foreground"
                    : log.success
                      ? "bg-emerald-500"
                      : "bg-destructive",
                )}
              />
              <span className="w-40 shrink-0 text-muted-foreground">
                {log.startedAt.toLocaleString("fr-FR")}
              </span>
              <span className="w-24 shrink-0 rounded-full bg-accent px-2 py-0.5 text-center text-xs">
                {log.trigger === "manual" ? "Manuel" : "Planifie"}
              </span>
              <span className="w-16 shrink-0 text-muted-foreground">
                {formatDuration(log.startedAt, log.finishedAt)}
              </span>
              {log.success ? (
                <span className="flex-1 text-muted-foreground">
                  {log.sourceCount} source(s) - {log.modelCount} modele(s) - {log.renderCount} render(s)
                </span>
              ) : (
                <span className="flex-1 truncate text-destructive">{log.errorMessage || "Echec"}</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
