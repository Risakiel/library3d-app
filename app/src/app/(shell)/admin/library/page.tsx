import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { tagColorClass } from "@/lib/tagColors";
import { sortByName, sortTagsByColorThenName } from "@/lib/tags";

export const dynamic = "force-dynamic";

interface Filters {
  search: string | undefined;
  sourceId: string | undefined;
  statusId: string | undefined;
  marketplaceTagId: string | undefined;
  blueTagId: string | undefined;
  includeArchived: boolean;
}

async function getModels(filters: Filters) {
  const conditions: Prisma.Model3DWhereInput[] = [];
  if (filters.search) conditions.push({ name: { contains: filters.search, mode: "insensitive" } });
  if (filters.sourceId) conditions.push({ sourceId: filters.sourceId });
  if (filters.statusId) conditions.push({ statusId: filters.statusId });
  if (filters.marketplaceTagId) conditions.push({ tags: { some: { id: filters.marketplaceTagId } } });
  if (filters.blueTagId) conditions.push({ tags: { some: { id: filters.blueTagId } } });
  if (!filters.includeArchived) conditions.push({ archived: false });

  return prisma.model3D.findMany({
    where: conditions.length > 0 ? { AND: conditions } : undefined,
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
  searchParams: {
    q?: string;
    sourceId?: string;
    statusId?: string;
    marketplaceTagId?: string;
    blueTagId?: string;
    includeArchived?: string;
  };
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const filters: Filters = {
    search: searchParams.q?.trim() || undefined,
    sourceId: searchParams.sourceId || undefined,
    statusId: searchParams.statusId || undefined,
    marketplaceTagId: searchParams.marketplaceTagId || undefined,
    blueTagId: searchParams.blueTagId || undefined,
    includeArchived: searchParams.includeArchived === "1",
  };

  const [models, sourcesRaw, statuses, marketplaceTagsRaw, blueTagsRaw] = await Promise.all([
    getModels(filters),
    prisma.source.findMany(),
    prisma.status.findMany({ orderBy: { position: "asc" } }),
    prisma.tag.findMany({ where: { color: "RED", archived: false } }),
    prisma.tag.findMany({ where: { color: "BLUE", archived: false } }),
  ]);

  const sources = sortByName(sourcesRaw);
  const marketplaceTags = sortByName(marketplaceTagsRaw);
  const blueTags = sortByName(blueTagsRaw);

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.sourceId) ||
    Boolean(filters.statusId) ||
    Boolean(filters.marketplaceTagId) ||
    Boolean(filters.blueTagId) ||
    filters.includeArchived;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-sm text-muted-foreground">{models.length} modele(s)</p>
      </div>

      <form action="/admin/library" method="get" className="flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={filters.search} placeholder="Rechercher un modele..." className="max-w-sm" />

        <Select name="sourceId" defaultValue={filters.sourceId ?? ""}>
          <SelectOption value="">Toutes les sources</SelectOption>
          {sources.map((source) => (
            <SelectOption key={source.id} value={source.id}>
              {source.name}
            </SelectOption>
          ))}
        </Select>

        <Select name="statusId" defaultValue={filters.statusId ?? ""}>
          <SelectOption value="">Tous les statuts</SelectOption>
          {statuses.map((status) => (
            <SelectOption key={status.id} value={status.id}>
              {status.name}
            </SelectOption>
          ))}
        </Select>

        <Select name="marketplaceTagId" defaultValue={filters.marketplaceTagId ?? ""}>
          <SelectOption value="">Toutes les marketplaces</SelectOption>
          {marketplaceTags.map((tag) => (
            <SelectOption key={tag.id} value={tag.id}>
              {tag.name}
            </SelectOption>
          ))}
        </Select>

        <Select name="blueTagId" defaultValue={filters.blueTagId ?? ""}>
          <SelectOption value="">Tous les tags</SelectOption>
          {blueTags.map((tag) => (
            <SelectOption key={tag.id} value={tag.id}>
              {tag.name}
            </SelectOption>
          ))}
        </Select>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="includeArchived"
            value="1"
            defaultChecked={filters.includeArchived}
            className="h-4 w-4 rounded border-input"
          />
          Inclure les archives
        </label>

        <Button type="submit">Rechercher</Button>

        {hasFilters && (
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
                <tr
                  key={model.id}
                  className={cn("border-b border-border last:border-0", model.archived && "opacity-50")}
                >
                  <td className="p-3 font-medium">
                    {model.name}
                    {model.archived && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                        Archive
                      </span>
                    )}
                  </td>
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
                      {sortTagsByColorThenName(model.tags).map((tag) => (
                        <span
                          key={tag.id}
                          className={cn("rounded-full px-2 py-0.5 text-xs", tagColorClass(tag.color))}
                        >
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
