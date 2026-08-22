import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModelGrid, type ModelCardData } from "@/components/ModelGrid";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

async function getModels(search: string | undefined, page: number) {
  const where = {
    archived: false,
    name: search ? { contains: search, mode: "insensitive" as const } : undefined,
  };

  const [models, total] = await Promise.all([
    prisma.model3D.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        source: { select: { name: true } },
        status: { select: { id: true, name: true } },
        coverRender: true,
        renders: { take: 1, orderBy: { filename: "asc" } },
        tags: { select: { id: true, name: true, color: true } },
        _count: { select: { renders: true } },
      },
    }),
    prisma.model3D.count({ where }),
  ]);

  return { models, total };
}

async function getEditableOptions() {
  const [statuses, blueTags] = await Promise.all([
    prisma.status.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    prisma.tag.findMany({
      where: { color: "BLUE", archived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return { statuses, blueTags };
}

interface HomePageProps {
  searchParams: { q?: string; page?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const search = searchParams.q?.trim() || undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const [{ models, total }, { statuses, blueTags }] = await Promise.all([
    getModels(search, page),
    getEditableOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("page", String(targetPage));
    return `/?${params.toString()}`;
  }

  if (models.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Library3D</h1>
        <p className="mt-4 text-muted-foreground">
          {search
            ? `Aucun modele ne correspond a "${search}".`
            : (
                <>
                  Aucun modele en base pour le moment. Lance un scan depuis{" "}
                  <a href="/admin" className="text-primary underline-offset-4 hover:underline">
                    l&apos;administration
                  </a>
                  .
                </>
              )}
        </p>
      </div>
    );
  }

  const cardModels: ModelCardData[] = models.map((model) => {
    const cover = model.coverRender ?? model.renders[0] ?? null;
    return {
      id: model.id,
      name: model.name,
      source: model.source.name,
      statusId: model.status?.id ?? null,
      statusName: model.status?.name ?? null,
      coverPath: cover?.relativePath ?? null,
      photoCount: model._count.renders,
      tags: model.tags,
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Library3D</h1>
        <p className="text-sm text-muted-foreground">
          {total} modele(s) - page {page} sur {totalPages}
        </p>
      </div>

      <ModelGrid models={cardModels} statuses={statuses} blueTags={blueTags} />

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={buttonVariants({ variant: "outline" })}>
              Precedent
            </Link>
          ) : (
            <span className={cn(buttonVariants({ variant: "outline" }), "pointer-events-none opacity-40")}>
              Precedent
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className={buttonVariants({ variant: "outline" })}>
              Suivant
            </Link>
          ) : (
            <span className={cn(buttonVariants({ variant: "outline" }), "pointer-events-none opacity-40")}>
              Suivant
            </span>
          )}
        </div>
      )}
    </div>
  );
}
