import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function getSources() {
  return prisma.source.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { models: true } } },
  });
}

export default async function SourcesPage() {
  const sources = await getSources();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Source</h1>
        <p className="text-sm text-muted-foreground">
          Renseigne automatiquement depuis les dossiers du NAS lors d&apos;un scan (dedoublonne par nom).
        </p>
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {sources.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Aucune source pour le moment.</p>
          )}
          {sources.map((source) => (
            <div key={source.id} className="flex items-center justify-between p-3">
              <span className="text-sm">{source.name}</span>
              <span className="text-xs text-muted-foreground">{source._count.models} modele(s)</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
