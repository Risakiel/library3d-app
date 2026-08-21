import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { NAS_ROOT } from "@/lib/scanner";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

// Cache local (dans le conteneur) des miniatures deja redimensionnees.
// Vide a chaque redeploiement, mais evite de re-lire/redimensionner depuis
// le NAS a chaque affichage pendant la duree de vie du conteneur.
const CACHE_ROOT = "/app/.cache/renders";
const THUMBNAIL_WIDTH = 640;

export async function GET(_request: Request, { params }: { params: { path: string[] } }) {
  const relativePath = params.path.join("/");
  const nasRootResolved = path.resolve(NAS_ROOT);
  const resolvedPath = path.resolve(nasRootResolved, relativePath);

  if (!resolvedPath.startsWith(nasRootResolved + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const extension = path.extname(resolvedPath).toLowerCase();
  const mimeType = MIME_TYPES[extension];
  if (!mimeType) {
    return new NextResponse("Unsupported file type", { status: 415 });
  }

  // Les GIF ne sont pas redimensionnes, pour ne pas casser l'animation.
  if (extension === ".gif") {
    try {
      const data = await fs.readFile(resolvedPath);
      return new NextResponse(data, {
        headers: { "Content-Type": mimeType, "Cache-Control": "public, max-age=604800" },
      });
    } catch {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  const cachePath = path.join(CACHE_ROOT, `${relativePath}.webp`);

  try {
    const cached = await fs.readFile(cachePath);
    return new NextResponse(cached, {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=604800" },
    });
  } catch {
    // Pas encore en cache : on genere la miniature ci-dessous.
  }

  let original: Buffer;
  try {
    original = await fs.readFile(resolvedPath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const resized = await sharp(original)
      .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, resized);

    return new NextResponse(resized, {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=604800" },
    });
  } catch (error) {
    console.error(`[renders] Echec du redimensionnement pour ${relativePath}`, error);
    // Si le redimensionnement echoue, on sert au moins l'original.
    return new NextResponse(original, {
      headers: { "Content-Type": mimeType, "Cache-Control": "public, max-age=604800" },
    });
  }
}
