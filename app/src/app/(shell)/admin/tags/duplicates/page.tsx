import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tagColorClass } from "@/lib/tagColors";
import { normalizeTagName, sortByName } from "@/lib/tags";

export const dynamic = "force-dynamic";

async function getDuplicateClusters() {
  const tags = sortByName(
    await prisma.tag.findMany({
      where: { archived: false },
      include: { _count: { select: { models: true } } },
    }),
  );

  const groups = new Map<string, typeof tags>();
  for (const tag of tags) {
    const key = normalizeTagName(tag.name);
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.push(tag);
    } else {
      groups.set(key, [tag]);
    }
  }

  return Array.from(groups.values()).filter((group) => group.length > 1);
}

export default async function TagDuplicatesPage() {
  const clusters = await getDuplicateClusters();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/tags" className="text-sm text-primary hover:underline">
          &larr; Retour aux Tags
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Doublons de tags</h1>
        <p className="text-sm text-muted-foreground">
          Detectes en ignorant la casse, les espaces et la ponctuation (ex: &quot;Azur Lane&quot;,
          &quot;AzurLane&quot;, &quot;azurlane&quot;).
        </p>
      </div>

      {clusters.length === 0 && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Aucun doublon detecte pour le moment.
          </CardContent>
        </Card>
      )}

      {clusters.map((cluster) => {
        const defaultKeepId = [...cluster].sort((a, b) => b._count.models - a._count.models)[0].id;
        return (
          <Card key={cluster.map((tag) => tag.id).join("-")}>
            <CardContent className="p-4">
              <form action="/admin/tags/merge" method="post" className="space-y-3">
                {cluster.map((tag) => (
                  <input key={tag.id} type="hidden" name="clusterTagIds" value={tag.id} />
                ))}
                {cluster.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-3 text-sm">
                    <input
                      type="radio"
                      name="keepTagId"
                      value={tag.id}
                      defaultChecked={tag.id === defaultKeepId}
                      className="h-4 w-4"
                    />
                    <span className={cn("rounded-full px-2 py-0.5 text-xs", tagColorClass(tag.color))}>
                      {tag.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{tag._count.models} modele(s)</span>
                  </label>
                ))}
                <Button type="submit" size="sm">
                  Fusionner vers le tag selectionne
                </Button>
              </form>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
