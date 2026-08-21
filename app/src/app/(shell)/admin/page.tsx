import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [modelCount, sourceCount, tagCount, renderCount, statusBreakdown, sourcesByCount, marketplacesByCount, topBlueTags] =
    await Promise.all([
      prisma.model3D.count(),
      prisma.source.count(),
      prisma.tag.count(),
      prisma.render.count(),
      prisma.status.findMany({
        orderBy: { position: "asc" },
        include: { _count: { select: { models: true } } },
      }),
      prisma.source.findMany({
        orderBy: { models: { _count: "desc" } },
        include: { _count: { select: { models: true } } },
      }),
      prisma.tag.findMany({
        where: { color: "RED" },
        orderBy: { models: { _count: "desc" } },
        include: { _count: { select: { models: true } } },
      }),
      prisma.tag.findMany({
        where: { color: "BLUE" },
        orderBy: { models: { _count: "desc" } },
        take: 10,
        include: { _count: { select: { models: true } } },
      }),
    ]);

  const withoutStatus = await prisma.model3D.count({ where: { statusId: null } });

  return {
    modelCount,
    sourceCount,
    tagCount,
    renderCount,
    statusBreakdown,
    withoutStatus,
    sourcesByCount,
    marketplacesByCount,
    topBlueTags,
  };
}

export default async function DashboardPage() {
  const {
    modelCount,
    sourceCount,
    tagCount,
    renderCount,
    statusBreakdown,
    withoutStatus,
    sourcesByCount,
    marketplacesByCount,
    topBlueTags,
  } = await getDashboardData();

  const maxCount = Math.max(withoutStatus, ...statusBreakdown.map((s) => s._count.models), 1);

  const stats = [
    { label: "Modeles", value: modelCount },
    { label: "Sources", value: sourceCount },
    { label: "Tags", value: tagCount },
    { label: "Renders", value: renderCount },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Repartition par statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusBreakdown.map((status) => (
              <div key={status.id} className="flex items-center gap-3">
                <span className="w-32 truncate text-sm">{status.name}</span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(status._count.models / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm text-muted-foreground">{status._count.models}</span>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <span className="w-32 truncate text-sm text-muted-foreground">Sans statut</span>
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-muted-foreground/40"
                  style={{ width: `${(withoutStatus / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm text-muted-foreground">{withoutStatus}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top des tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topBlueTags.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun tag pour le moment.</p>
            )}
            {topBlueTags.map((tag, index) => (
              <div key={tag.id} className="flex items-center gap-3">
                <span className="w-5 text-sm text-muted-foreground">{index + 1}</span>
                <span className="w-32 truncate text-sm">{tag.name}</span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${(tag._count.models / Math.max(topBlueTags[0]?._count.models ?? 1, 1)) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right text-sm text-muted-foreground">{tag._count.models}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Modeles par createur</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 divide-y divide-border overflow-y-auto p-0">
            {sourcesByCount.map((source) => (
              <div key={source.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{source.name}</span>
                <span className="text-muted-foreground">{source._count.models}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modeles par marketplace</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 divide-y divide-border overflow-y-auto p-0">
            {marketplacesByCount.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Aucune marketplace detectee.</p>
            )}
            {marketplacesByCount.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{tag.name}</span>
                <span className="text-muted-foreground">{tag._count.models}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
