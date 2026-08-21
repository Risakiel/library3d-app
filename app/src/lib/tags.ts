import { prisma } from "@/lib/prisma";
import type { TagColor } from "@prisma/client";

const COLOR_ORDER: Record<TagColor, number> = { RED: 0, GREEN: 1, BLUE: 2 };

export function normalizeTagName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

export function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

export function sortTagsByColorThenName<T extends { color: TagColor; name: string }>(tags: T[]): T[] {
  return [...tags].sort((a, b) => {
    const colorDiff = COLOR_ORDER[a.color] - COLOR_ORDER[b.color];
    return colorDiff !== 0 ? colorDiff : a.name.localeCompare(b.name);
  });
}

/**
 * Reutilise un tag existant (nom exact, puis nom "similaire" en ignorant
 * casse/espaces/accents/ponctuation) au lieu d'en creer un nouveau quasi-
 * doublon. Ne cree un nouveau tag que si aucune correspondance n'est trouvee.
 */
export async function findOrCreateTag(rawName: string, color: TagColor) {
  const name = rawName.trim();
  if (!name) return null;

  const exact = await prisma.tag.findUnique({ where: { name } });
  if (exact) return exact;

  const key = normalizeTagName(name);
  if (key) {
    const allTags = await prisma.tag.findMany();
    const similar = allTags.find((tag) => normalizeTagName(tag.name) === key);
    if (similar) return similar;
  }

  return prisma.tag.create({ data: { name, color } });
}
