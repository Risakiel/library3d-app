import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findOrCreateTag } from "@/lib/tags";

// Public (pas de connexion admin requise) mais volontairement limite aux tags
// bleus : les rouges/verts sont geres automatiquement par le scan.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
  }

  let tag = null;
  if (typeof body.tagId === "string" && body.tagId) {
    const existing = await prisma.tag.findUnique({ where: { id: body.tagId } });
    if (!existing || existing.color !== "BLUE") {
      return NextResponse.json({ error: "Tag invalide" }, { status: 400 });
    }
    tag = existing;
  } else if (typeof body.name === "string" && body.name.trim()) {
    tag = await findOrCreateTag(body.name, "BLUE");
  }

  if (!tag) {
    return NextResponse.json({ error: "Tag manquant" }, { status: 400 });
  }

  await prisma.model3D.update({
    where: { id: params.id },
    data: { tags: { connect: { id: tag.id } } },
  });

  return NextResponse.json({ tag: { id: tag.id, name: tag.name, color: tag.color } });
}
