import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findOrCreateTag } from "@/lib/tags";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  const selectedNames = formData.getAll("tagNames").map((value) => String(value));
  const returnTo = String(formData.get("returnTo") || `/admin/library/${params.id}`);

  for (const name of selectedNames) {
    const tag = await findOrCreateTag(name, "BLUE");
    if (!tag) continue;
    await prisma.model3D.update({
      where: { id: params.id },
      data: { tags: { connect: { id: tag.id } } },
    });
  }

  await prisma.tagSuggestion.deleteMany({ where: { modelId: params.id } });

  return new NextResponse(null, {
    status: 303,
    headers: { Location: returnTo },
  });
}
