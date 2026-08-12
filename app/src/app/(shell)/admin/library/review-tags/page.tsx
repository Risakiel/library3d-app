import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tagColorClass } from "@/lib/tagColors";

export const dynamic = "force-dynamic";

async function getModelsWithSuggestions() {
  return prisma.model3D.findMany({
    where: { tagSuggestions: { some: {} } },
    orderBy: { name: "asc" },
    include: { tagSuggestions: true },
  });
}

export default async function ReviewTagsPage() {
  const models = await getModelsWithSuggestions();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suggestions de tags en attente</h1>
        <p className="text-sm text-muted-foreground">{models.length} modele(s) a valider</p>
      </div>

      {models.length === 0 && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Aucune suggestion en attente. Lance une recherche depuis la fiche d&apos;un modele ou depuis un
            tag marketplace sur la page{" "}
            <Link href="/admin/tags" className="text-primary hover:underline">
              Tags
            </Link>
            .
          </CardContent>
        </Card>
      )}

      {models.map((model) => (
        <Card key={model.id}>
          <CardHeader>
            <CardTitle className="text-base">
              <Link href={`/admin/library/${model.id}`} className="hover:underline">
                {model.name}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={`/admin/library/${model.id}/apply-tag-suggestions`}
              method="post"
              className="space-y-3"
            >
              <input type="hidden" name="returnTo" value="/admin/library/review-tags" />
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
              <Button type="submit" size="sm">
                Ajouter les tags selectionnes
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
