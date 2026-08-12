import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMarketplaceSupported, lookupMarketplaceTags } from "@/lib/marketplaceLookup";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const model = await prisma.model3D.findUnique({
    where: { id: params.id },
    include: { tags: true },
  });

  const marketplaceTag = model?.tags.find((tag) => tag.color === "RED" && isMarketplaceSupported(tag.name));

  if (model && marketplaceTag) {
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
      console.error(`[lookup] Echec de recherche pour "${model.name}"`, error);
    }
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/admin/library/${params.id}` },
  });
}
