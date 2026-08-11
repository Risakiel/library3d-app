import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getModels(search: string | undefined, sourceId: string | undefined, statusId: string | undefined) {
  return prisma.model3D.findMany({
    where: {
      name: search ? { contains: search, mode: "insensitive" } : undefined,
      sourceId: sourceId || undefined,
      statusId: statusId || undefined,
    },
    orderBy: { name: "asc" },
    include: {
      source: true,
      status: true,
      tags: true,
      _count: { select: { renders: true } },
    },
  });
}

interface LibraryPageProps {
  searchParams: { q?: string; sourceId?: string; statusId?: string };
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const search = searchParams.q?.trim() || undefined;
  const sourceId = searchParams.sourceId || undefined;
  const statusId = searchParams.statusId || undefined;

  const [models, sources, statuses] = await Promise.all([
    getModels(search, sourceId, statusId),
    prisma.source.findMany({ orderBy: { name: "asc" } }),
    prisma.status.findMany({ orderBy: { position: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-sm text-muted-foreground">{models.length} modele(s)</p>
      </div>

      <form action="/admin/library" method="get" className="flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={search} placeholder="Rechercher un modele..." className="max-w-sm" />

        <select
          name="sourceId"
          defaultValue={sourceId ?? ""}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Toutes les sources</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>

        <select
          name="statusId"
          defaultValue={statusId ?? ""}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Tous les statuts</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>

        <Button type="submit">Rechercher</Button>

        {(search || sourceId || statusId) && (
          <Link href="/admin/library" className={buttonVariants({ variant: "outline" })}>
            Reinitialiser
          </Link>
        )}
      </form>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="p-3">Nom</th>
                <th className="p-3">Source</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Tags</th>
                <th className="p-3">Photos</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{model.name}</td>
                  <td className="p-3 text-muted-foreground">{model.source.name}</td>
                  <td className="p-3">
                    {model.status ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{model.status.name}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {model.tags.map((tag) => (
                        <span key={tag.id} className="rounded-full bg-accent px-2 py-0.5 text-xs">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{model._count.renders}</td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/library/${model.id}`}
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      Editer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
