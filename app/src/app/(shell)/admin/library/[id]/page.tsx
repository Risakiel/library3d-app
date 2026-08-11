import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getModel(id: string) {
  return prisma.model3D.findUnique({
    where: { id },
    include: {
      source: true,
      status: true,
      tags: true,
      renders: { take: 1, orderBy: { filename: "asc" } },
    },
  });
}

interface LibraryEditPageProps {
  params: { id: string };
}

export default async function LibraryEditPage({ params }: LibraryEditPageProps) {
  const model = await getModel(params.id);
  if (!model) notFound();

  const [statuses, tags] = await Promise.all([
    prisma.status.findMany({ orderBy: { position: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const cover = model.renders[0];
  const modelTagIds = new Set(model.tags.map((tag) => tag.id));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/library" className="text-sm text-primary hover:underline">
          &larr; Retour a la Library
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{model.name}</h1>
        <p className="text-sm text-muted-foreground">Source : {model.source.name}</p>
      </div>

      <div className="grid grid-cols-[160px_1fr] gap-6">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/renders/${cover.relativePath}`}
              alt={model.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs text-muted-foreground">Pas de photo</span>
          )}
        </div>

        <form action={`/admin/library/${model.id}/update`} method="post" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                name="statusId"
                defaultValue={model.statusId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Aucun statut</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {tags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun tag cree pour le moment -{" "}
                  <Link href="/admin/tags" className="text-primary hover:underline">
                    en creer un
                  </Link>
                  .
                </p>
              )}
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="tagIds"
                    value={tag.id}
                    defaultChecked={modelTagIds.has(tag.id)}
                    className="h-4 w-4 rounded border-input"
                  />
                  {tag.name}
                </label>
              ))}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button type="submit">Enregistrer</Button>
            <Link href="/admin/library" className={buttonVariants({ variant: "outline" })}>
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
