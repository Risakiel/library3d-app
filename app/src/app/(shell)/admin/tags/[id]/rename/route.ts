import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  const name = String(formData.get("name") || "").trim();

  if (name) {
    try {
      await prisma.tag.update({ where: { id: params.id }, data: { name } });
    } catch {
      // Un tag avec ce nom existe deja : on fusionne plutot que de dupliquer.
      const target = await prisma.tag.findUnique({ where: { name } });
      const source = await prisma.tag.findUnique({
        where: { id: params.id },
        include: { models: { select: { id: true } } },
      });

      if (target && source && target.id !== source.id) {
        for (const model of source.models) {
          await prisma.model3D.update({
            where: { id: model.id },
            data: { tags: { connect: { id: target.id } } },
          });
        }
        await prisma.tag.delete({ where: { id: source.id } });
      }
    }
  }

  return new NextResponse(null, { status: 303, headers: { Location: "/admin/tags" } });
}
