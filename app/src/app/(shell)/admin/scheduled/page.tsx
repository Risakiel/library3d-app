import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const JOB_KEY = "scan_library";

const INTERVAL_OPTIONS = [
  { minutes: 1440, label: "Une fois par jour" },
  { minutes: 4320, label: "Tous les 3 jours" },
  { minutes: 10080, label: "Une fois par semaine" },
];

async function getConfig() {
  return prisma.scheduleConfig.findUnique({ where: { jobKey: JOB_KEY } });
}

export default async function ScheduledPage() {
  const config = await getConfig();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Scheduled</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scan de la bibliotheque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action="/admin/scheduled/run" method="post">
            <Button type="submit">Lancer maintenant</Button>
          </form>

          <form
            action="/admin/scheduled/update"
            method="post"
            className="space-y-3 border-t border-border pt-4"
          >
            <input type="hidden" name="jobKey" value={JOB_KEY} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={config?.enabled ?? false}
                className="h-4 w-4 rounded border-input"
              />
              Executer automatiquement
            </label>

            <select
              name="intervalMinutes"
              defaultValue={config?.intervalMinutes ?? 1440}
              className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {INTERVAL_OPTIONS.map((option) => (
                <option key={option.minutes} value={option.minutes}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button type="submit" variant="secondary">
              Enregistrer
            </Button>
          </form>

          {config?.lastRunAt && (
            <p className="text-xs text-muted-foreground">
              Derniere execution planifiee : {config.lastRunAt.toLocaleString("fr-FR")}
            </p>
          )}
          {config?.enabled && config?.nextRunAt && (
            <p className="text-xs text-muted-foreground">
              Prochaine execution prevue : {config.nextRunAt.toLocaleString("fr-FR")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
