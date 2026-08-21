import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { tagColorClass } from "@/lib/tagColors";
import { isMarketplaceSupported } from "@/lib/marketplaceLookup";

export const dynamic = "force-dynamic";

const GROUPS = [
  { color: "RED" as const, label: "Marketplace" },
  { color: "GREEN" as const, label: "Createur" },
  { color: "BLUE" as const, label: "Autres" },
];

async function getTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { models: true } } },
  });
}

export default async function TagsPage() {
  const tags = await getTags();
  const activeTags = tags.filter((tag) => !tag.archived);
  const archivedTags = tags.filter((tag) => tag.archived);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tags</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/tags/duplicates" className="text-sm text-primary hover:underline">
            Doublons
          </Link>
          <Link href="/admin/library/review-tags" className="text-sm text-primary hover:underline">
            Suggestions en attente
          </Link>
          <form action="/admin/tags/detect-from-names" method="post">
            <Button type="submit" variant="outline" size="sm">
              Detecter depuis les noms
            </Button>
          </form>
        </div>
      </div>

      {GROUPS.map((group) => {
        const groupTags = activeTags.filter((tag) => tag.color === group.color);
        return (
          <Card key={group.color}>
            <CardContent className="divide-y divide-border p-0">
              <div className="flex items-center gap-2 p-3">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", tagColorClass(group.color))}>
                  {group.label}
                </span>
                <span className="text-xs text-muted-foreground">{groupTags.length} tag(s)</span>
              </div>
              {groupTags.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">Aucun tag dans cette categorie.</p>
              )}
              {groupTags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-3 p-3">
                  <form
                    action={`/admin/tags/${tag.id}/rename`}
                    method="post"
                    className="flex flex-1 items-center gap-2"
                  >
                    <Input name="name" defaultValue={tag.name} className="h-8" />
                    <Button type="submit" variant="secondary" size="sm">
                      Renommer
                    </Button>
                  </form>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {tag._count.models} modele(s)
                  </span>
                  {group.color === "RED" && isMarketplaceSupported(tag.name) && (
                    <form action={`/admin/tags/${tag.id}/lookup-marketplace`} method="post">
                      <Button type="submit" variant="secondary" size="sm">
                        Chercher les tags
                      </Button>
                    </form>
                  )}
                  <form action={`/admin/tags/${tag.id}/archive`} method="post">
                    <Button type="submit" variant="outline" size="sm">
                      Archiver
                    </Button>
                  </form>
                  <form action={`/admin/tags/${tag.id}/delete`} method="post">
                    <Button type="submit" variant="outline" size="sm">
                      Supprimer
                    </Button>
                  </form>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardContent className="p-4">
          <form action="/admin/tags/create" method="post" className="flex items-center gap-2">
            <Input name="name" placeholder="Nouveau tag (bleu)..." required className="max-w-xs" />
            <Button type="submit">Ajouter</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Les tags marketplace/createur sont crees et colores automatiquement a chaque scan. Renommer un
            tag vers un nom existant fusionne les deux automatiquement.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          <div className="flex items-center gap-2 p-3">
            <span className="text-sm font-medium">Tags archives</span>
            <span className="text-xs text-muted-foreground">{archivedTags.length} tag(s)</span>
          </div>
          {archivedTags.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Aucun tag archive.</p>
          )}
          {archivedTags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-3 p-3">
              <span className={cn("rounded-full px-2 py-0.5 text-xs", tagColorClass(tag.color))}>
                {tag.name}
              </span>
              <span className="flex-1 text-xs text-muted-foreground">{tag._count.models} modele(s)</span>
              <form action={`/admin/tags/${tag.id}/unarchive`} method="post">
                <Button type="submit" variant="secondary" size="sm">
                  Desarchiver
                </Button>
              </form>
              <form action={`/admin/tags/${tag.id}/delete`} method="post">
                <Button type="submit" variant="outline" size="sm">
                  Supprimer
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
