import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { NAS_ROOT } from "@/lib/scanner";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(_request: Request, { params }: { params: { path: string[] } }) {
  const relativePath = params.path.join("/");
  const nasRootResolved = path.resolve(NAS_ROOT);
  const resolvedPath = path.resolve(nasRootResolved, relativePath);

  if (!resolvedPath.startsWith(nasRootResolved + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const mimeType = MIME_TYPES[path.extname(resolvedPath).toLowerCase()];
  if (!mimeType) {
    return new NextResponse("Unsupported file type", { status: 415 });
  }

  try {
    const data = await fs.readFile(resolvedPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
