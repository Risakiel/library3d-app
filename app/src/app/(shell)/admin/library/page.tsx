import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getModels(search: string | undefined) {
  return prisma.model3D.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
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
  searchParams: { q?: string };
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const search = searchParams.q?.trim() || undefined;
  const models = await getModels(search);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-sm text-muted-foreground">{models.length} modele(s)</p>
      </div>

      <form action="/admin/library" method="get" className="max-w-sm">
        <Input name="q" defaultValue={search} placeholder="Rechercher un modele..." />
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
