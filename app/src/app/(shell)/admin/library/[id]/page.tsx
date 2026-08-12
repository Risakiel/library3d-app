import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { tagColorClass } from "@/lib/tagColors";
import { isMarketplaceSupported } from "@/lib/marketplaceLookup";

export const dynamic = "force-dynamic";

async function getModel(id: string) {
  return prisma.model3D.findUnique({
    where: { id },
    include: {
      source: true,
      status: true,
      tags: true,
      tagSuggestions: true,
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
  const marketplaceTag = model.tags.find((tag) => tag.color === "RED" && isMarketplaceSupported(tag.name));

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
              <Select name="statusId" defaultValue={model.statusId ?? ""} className="w-full">
                <SelectOption value="">Aucun statut</SelectOption>
                {statuses.map((status) => (
                  <SelectOption key={status.id} value={status.id}>
                    {status.name}
                  </SelectOption>
                ))}
              </Select>
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
                <label
                  key={tag.id}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1 text-sm",
                    tagColorClass(tag.color),
                  )}
                >
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

      {marketplaceTag && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recherche marketplace ({marketplaceTag.name})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {model.tagSuggestions.length === 0 ? (
              <form action={`/admin/library/${model.id}/lookup-tags`} method="post">
                <Button type="submit" variant="secondary">
                  Chercher les tags en ligne
                </Button>
              </form>
            ) : (
              <form
                action={`/admin/library/${model.id}/apply-tag-suggestions`}
                method="post"
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground">
                  Trouve sur{" "}
                  <a
                    href={model.tagSuggestions[0].sourceUrl ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {model.tagSuggestions[0].sourceTitle || marketplaceTag.name}
                  </a>{" "}
                  - decoche ce que tu ne veux pas garder :
                </p>
                <div className="flex flex-wrap gap-3">
                  {model.tagSuggestions.map((suggestion) => (
                    <label
                      key={suggestion.id}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3 py-1 text-sm",
                        tagColorClass("BLUE"),
                      )}
                    >
                      <input
                        type="checkbox"
                        name="tagNames"
                        value={suggestion.tagName}
                        defaultChecked
                        className="h-4 w-4 rounded border-input"
                      />
                      {suggestion.tagName}
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Button type="submit">Ajouter les tags selectionnes</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
