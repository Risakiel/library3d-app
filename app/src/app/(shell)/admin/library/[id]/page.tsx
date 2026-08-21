import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { tagColorClass } from "@/lib/tagColors";
import { isMarketplaceSupported } from "@/lib/marketplaceLookup";
import { sortTagsByColorThenName } from "@/lib/tags";

export const dynamic = "force-dynamic";

const EDIT_FORM_ID = "model-edit-form";

async function getModel(id: string) {
  return prisma.model3D.findUnique({
    where: { id },
    include: {
      source: true,
      status: true,
      tags: true,
      tagSuggestions: true,
      coverRender: true,
      renders: { orderBy: { filename: "asc" } },
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
    prisma.tag.findMany({
      where: { OR: [{ archived: false }, { id: { in: model.tags.map((tag) => tag.id) } }] },
      orderBy: { name: "asc" },
    }),
  ]);

  const cover = model.coverRender ?? model.renders[0] ?? null;
  const modelTagIds = new Set(model.tags.map((tag) => tag.id));
  const marketplaceTag = model.tags.find((tag) => tag.color === "RED" && isMarketplaceSupported(tag.name));

  const sortedTags = sortTagsByColorThenName(tags);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/library" className="text-sm text-primary hover:underline">
          &larr; Retour a la Library
        </Link>
        <div className="flex items-center gap-3">
          <form action={`/admin/library/${model.id}/toggle-archive`} method="post">
            <Button type="submit" variant="outline">
              {model.archived ? "Desarchiver" : "Archiver"}
            </Button>
          </form>
          <Button type="submit" form={EDIT_FORM_ID}>
            Enregistrer
          </Button>
          <Link href="/admin/library" className={buttonVariants({ variant: "outline" })}>
            Annuler
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {model.name}
          {model.archived && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              Archive
            </span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground">Source : {model.source.name}</p>
      </div>

      <div className="flex gap-6">
        <div className="flex aspect-square w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
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

        <form
          id={EDIT_FORM_ID}
          action={`/admin/library/${model.id}/update`}
          method="post"
          className="flex-1"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select name="statusId" defaultValue={model.statusId ?? ""} className="w-full">
                <SelectOption value="">Aucun statut</SelectOption>
                {statuses.map((status) => (
                  <SelectOption key={status.id} value={status.id}>
                    {status.name}
                  </SelectOption>
                ))}
              </Select>

              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Path</label>
                <input
                  readOnly
                  value={model.folderPath}
                  className="flex h-9 w-full cursor-default rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground"
                />
              </div>
            </CardContent>
          </Card>
        </form>

        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recherche marketplace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!marketplaceTag && (
                <p className="text-sm text-muted-foreground">
                  Aucune marketplace supportee detectee pour ce modele.
                </p>
              )}

              {marketplaceTag && model.tagSuggestions.length === 0 && (
                <form action={`/admin/library/${model.id}/lookup-tags`} method="post">
                  <Button type="submit" variant="secondary">
                    Chercher les tags en ligne
                  </Button>
                </form>
              )}

              {marketplaceTag && model.tagSuggestions.length > 0 && (
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
                  <Button type="submit">Ajouter les tags selectionnes</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tags</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[420px] overflow-y-auto">
          <div className="flex flex-wrap gap-3">
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun tag cree pour le moment -{" "}
                <Link href="/admin/tags" className="text-primary hover:underline">
                  en creer un
                </Link>
                .
              </p>
            )}
            {sortedTags.map((tag) => (
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
                  form={EDIT_FORM_ID}
                  defaultChecked={modelTagIds.has(tag.id)}
                  className="h-4 w-4 rounded border-input"
                />
                {tag.name}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos ({model.renders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {model.renders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune photo pour ce modele.</p>
          ) : (
            <form action={`/admin/library/${model.id}/set-cover`} method="post" className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {model.renders.map((render) => (
                  <label key={render.id} className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "flex aspect-square w-40 items-center justify-center overflow-hidden rounded-lg bg-muted ring-2 ring-transparent",
                        render.id === cover?.id && "ring-primary",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/renders/${render.relativePath}`}
                        alt={render.filename}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="radio"
                        name="coverRenderId"
                        value={render.id}
                        defaultChecked={render.id === cover?.id}
                        className="h-3.5 w-3.5"
                      />
                      Photo principale
                    </span>
                  </label>
                ))}
              </div>
              <Button type="submit" size="sm">
                Definir la photo principale
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
