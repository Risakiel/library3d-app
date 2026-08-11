import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

async function getStatuses() {
  return prisma.status.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { models: true } } },
  });
}

export default async function StatusPage() {
  const statuses = await getStatuses();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Status</h1>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {statuses.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Aucun statut pour le moment.</p>
          )}
          {statuses.map((status, index) => (
            <div key={status.id} className="flex items-center gap-3 p-3">
              <div className="flex flex-col text-xs leading-none">
                <form action={`/admin/status/${status.id}`} method="post">
                  <input type="hidden" name="intent" value="move-up" />
                  <button
                    type="submit"
                    disabled={index === 0}
                    className="block px-1 py-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ▲
                  </button>
                </form>
                <form action={`/admin/status/${status.id}`} method="post">
                  <input type="hidden" name="intent" value="move-down" />
                  <button
                    type="submit"
                    disabled={index === statuses.length - 1}
                    className="block px-1 py-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ▼
                  </button>
                </form>
              </div>

              <form
                action={`/admin/status/${status.id}`}
                method="post"
                className="flex flex-1 items-center gap-2"
              >
                <input type="hidden" name="intent" value="rename" />
                <Input name="name" defaultValue={status.name} className="h-8" />
                <Button type="submit" variant="secondary" size="sm">
                  Renommer
                </Button>
              </form>

              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {status._count.models} modele(s)
              </span>

              <form action={`/admin/status/${status.id}`} method="post">
                <input type="hidden" name="intent" value="delete" />
                <Button type="submit" variant="outline" size="sm">
                  Supprimer
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <form action="/admin/status/create" method="post" className="flex items-center gap-2">
            <Input name="name" placeholder="Nouveau statut..." required className="max-w-xs" />
            <Button type="submit">Ajouter</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
