import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function getModels(search: string | undefined) {
  return prisma.model3D.findMany({
    where: {
      archived: false,
      name: search ? { contains: search, mode: "insensitive" } : undefined,
    },
    orderBy: { name: "asc" },
    include: {
      coverRender: true,
      renders: { take: 1, orderBy: { filename: "asc" } },
      _count: { select: { renders: true } },
    },
  });
}

interface HomePageProps {
  searchParams: { q?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const search = searchParams.q?.trim() || undefined;
  const models = await getModels(search);

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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Library3D</h1>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
        {models.map((model) => {
          const cover = model.coverRender ?? model.renders[0];
          return (
            <Card
              key={model.id}
              className="overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative flex aspect-square items-center justify-center bg-muted">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/renders/${cover.relativePath}`}
                    alt={model.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">Pas de photo</span>
                )}
                {model._count.renders > 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {model._count.renders} photo{model._count.renders > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <CardContent className="p-3">
                <p className="truncate text-sm font-medium">{model.name}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
