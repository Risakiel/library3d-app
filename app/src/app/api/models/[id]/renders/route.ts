import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const renders = await prisma.render.findMany({
    where: { modelId: params.id },
    orderBy: { filename: "asc" },
    select: { relativePath: true },
  });

  return NextResponse.json({ renders: renders.map((render) => render.relativePath) });
}
