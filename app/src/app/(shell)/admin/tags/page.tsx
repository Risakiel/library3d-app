import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

async function getTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { models: true } } },
  });
}

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Tags</h1>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {tags.length === 0 && <p className="p-4 text-sm text-muted-foreground">Aucun tag pour le moment.</p>}
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between gap-3 p-3">
              <span className="text-sm">{tag.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{tag._count.models} modele(s)</span>
                <form action={`/admin/tags/${tag.id}/delete`} method="post">
                  <Button type="submit" variant="outline" size="sm">
                    Supprimer
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <form action="/admin/tags/create" method="post" className="flex items-center gap-2">
            <Input name="name" placeholder="Nouveau tag..." required className="max-w-xs" />
            <Button type="submit">Ajouter</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
