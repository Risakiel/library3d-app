import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupMarketplaceTags } from "@/lib/marketplaceLookup";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const marketplaceTag = await prisma.tag.findUnique({
    where: { id: params.id },
    include: { models: true },
  });

  if (marketplaceTag && marketplaceTag.color === "RED") {
    console.log(
      `[lookup] Recherche groupee pour "${marketplaceTag.name}" (${marketplaceTag.models.length} modele(s))`,
    );

    for (const model of marketplaceTag.models) {
      try {
        const result = await lookupMarketplaceTags(marketplaceTag.name, model.name);
        if (result) {
          for (const tagName of result.tags) {
            await prisma.tagSuggestion.upsert({
              where: { modelId_tagName: { modelId: model.id, tagName } },
              update: { sourceUrl: result.url, sourceTitle: result.title },
              create: { modelId: model.id, tagName, sourceUrl: result.url, sourceTitle: result.title },
            });
          }
        }
      } catch (error) {
        console.error(`[lookup] Echec pour "${model.name}"`, error);
      }
      // Pause courte entre chaque requete pour rester poli avec le site cible.
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/admin/library/review-tags" },
  });
}
