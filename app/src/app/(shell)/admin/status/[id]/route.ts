import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function redirectToStatus() {
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/status" } });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent === "rename") {
    const name = String(formData.get("name") || "").trim();
    if (name) {
      await prisma.status.update({ where: { id: params.id }, data: { name } });
    }
  } else if (intent === "delete") {
    await prisma.status.delete({ where: { id: params.id } });
  } else if (intent === "move-up" || intent === "move-down") {
    const statuses = await prisma.status.findMany({ orderBy: { position: "asc" } });
    const index = statuses.findIndex((status) => status.id === params.id);
    const swapIndex = intent === "move-up" ? index - 1 : index + 1;

    if (index !== -1 && swapIndex >= 0 && swapIndex < statuses.length) {
      const current = statuses[index];
      const swap = statuses[swapIndex];
      await prisma.$transaction([
        prisma.status.update({ where: { id: current.id }, data: { position: swap.position } }),
        prisma.status.update({ where: { id: swap.id }, data: { position: current.position } }),
      ]);
    }
  }

  return redirectToStatus();
}
