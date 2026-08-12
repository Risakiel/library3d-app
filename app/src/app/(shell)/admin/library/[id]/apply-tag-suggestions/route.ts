import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  const selectedNames = formData.getAll("tagNames").map((value) => String(value));
  const returnTo = String(formData.get("returnTo") || `/admin/library/${params.id}`);

  for (const name of selectedNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name, color: "BLUE" },
    });
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
