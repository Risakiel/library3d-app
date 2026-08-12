import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const models = await prisma.model3D.findMany({ select: { id: true, name: true } });

  let tagged = 0;
  for (const model of models) {
    // "Personnage - Franchise - Variante" -> on prend le 2e segment ("Franchise"),
    // jamais le dernier, pour eviter qu'un suffixe comme "- Bust Version" soit
    // pris pour une franchise.
    const parts = model.name.split(" - ");
    if (parts.length < 2) continue;

    const franchiseName = parts[1].trim();
    if (!franchiseName) continue;

    const tag = await prisma.tag.upsert({
      where: { name: franchiseName },
      update: {},
      create: { name: franchiseName, color: "BLUE" },
    });

    await prisma.model3D.update({
      where: { id: model.id },
      data: { tags: { connect: { id: tag.id } } },
    });
    tagged += 1;
  }

  console.log(`[tags] Detection depuis les noms : ${tagged} modele(s) tagge(s)`);

  return new NextResponse(null, { status: 303, headers: { Location: "/admin/tags" } });
}
