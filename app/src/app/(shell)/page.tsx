import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function getModels() {
  return prisma.model3D.findMany({
    orderBy: { name: "asc" },
    include: {
      renders: { take: 1, orderBy: { filename: "asc" } },
    },
  });
}

export default async function HomePage() {
  const models = await getModels();

  if (models.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Library3D</h1>
        <p className="mt-4 text-muted-foreground">
          Aucun modele en base pour le moment. Lance un scan depuis{" "}
          <a href="/admin" className="text-primary underline-offset-4 hover:underline">
            l&apos;administration
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Library3D</h1>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {models.map((model) => {
          const cover = model.renders[0];
          return (
            <Card
              key={model.id}
              className="overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex aspect-square items-center justify-center bg-muted">
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
              </div>
              <CardContent className="p-3">
                <p className="truncate text-sm">{model.name}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
