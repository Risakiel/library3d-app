import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const keepTagId = String(formData.get("keepTagId") || "");
  const clusterTagIds = formData.getAll("clusterTagIds").map((value) => String(value));

  if (keepTagId) {
    const idsToMerge = clusterTagIds.filter((id) => id && id !== keepTagId);

    for (const tagId of idsToMerge) {
      const source = await prisma.tag.findUnique({
        where: { id: tagId },
        include: { models: { select: { id: true } } },
      });
      if (!source) continue;

      for (const model of source.models) {
        await prisma.model3D.update({
          where: { id: model.id },
          data: { tags: { connect: { id: keepTagId } } },
        });
      }

      await prisma.tag.delete({ where: { id: tagId } });
    }
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/admin/tags/duplicates" },
  });
}
