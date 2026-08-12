import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_STATUSES = [
  "New",
  "À préparer",
  "Prêt à imprimer",
  "Impression",
  "Post-traitement",
  "Préparation",
  "Sous-couche",
  "Peinture",
  "Finitions",
  "Assemblage",
  "Terminé",
  "En vitrine",
];

export async function POST() {
  let defaultStatusId: string | null = null;

  for (const [index, name] of DEFAULT_STATUSES.entries()) {
    const isDefault = index === 0;
    const status = await prisma.status.upsert({
      where: { name },
      update: { position: index, isDefault },
      create: { name, position: index, isDefault },
    });
    if (isDefault) defaultStatusId = status.id;
  }

  if (defaultStatusId) {
    await prisma.model3D.updateMany({
      where: { statusId: null },
      data: { statusId: defaultStatusId },
    });
  }

  return new NextResponse(null, { status: 303, headers: { Location: "/admin/status" } });
}
