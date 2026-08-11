import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

export const NAS_ROOT = "/library3d";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

export interface ScanResult {
  studios: number;
  models: number;
  renders: number;
}

interface ModelDir {
  name: string;
  folderPath: string;
  absolutePath: string;
}

async function listDirs(dirPath: string) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function listFiles(dirPath: string) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

async function findChildDir(parentPath: string, targetName: string) {
  const dirs = await listDirs(parentPath);
  return dirs.find((dir) => dir.toLowerCase() === targetName.toLowerCase());
}

/**
 * Descend recursivement jusqu'a trouver des dossiers modele (identifies par
 * la presence d'un sous-dossier Render ou STL). Gere aussi bien les studios
 * "Studio/Modele" (ex: Bulkamancer) que les marketplaces avec un niveau
 * vendeur en plus "Studio/Vendeur/Modele" (ex: CGTrader).
 */
async function collectModelDirs(dirPath: string, relativePrefix: string): Promise<ModelDir[]> {
  const subDirNames = await listDirs(dirPath);
  const results: ModelDir[] = [];

  for (const subDirName of subDirNames) {
    const subPath = path.join(dirPath, subDirName);
    const folderPath = `${relativePrefix}/${subDirName}`;

    const isModelDir =
      (await findChildDir(subPath, "Render")) !== undefined ||
      (await findChildDir(subPath, "STL")) !== undefined;

    if (isModelDir) {
      results.push({ name: subDirName, folderPath, absolutePath: subPath });
    } else {
      results.push(...(await collectModelDirs(subPath, folderPath)));
    }
  }

  return results;
}

export async function scanLibrary(): Promise<ScanResult> {
  const seenModelPaths = new Set<string>();
  const seenRenderPaths = new Set<string>();

  let studioCount = 0;
  let modelCount = 0;
  let renderCount = 0;

  console.log(`[scan] Debut du scan de ${NAS_ROOT}`);

  const studioNames = await listDirs(NAS_ROOT);
  console.log(`[scan] ${studioNames.length} studio(s) trouve(s)`);

  for (const studioName of studioNames) {
    const studio = await prisma.studio.upsert({
      where: { name: studioName },
      update: {},
      create: { name: studioName },
    });
    studioCount += 1;

    const studioPath = path.join(NAS_ROOT, studioName);
    const modelDirs = await collectModelDirs(studioPath, studioName);
    console.log(`[scan] Studio "${studioName}" : ${modelDirs.length} modele(s)`);

    for (const modelDir of modelDirs) {
      const model = await prisma.model3D.upsert({
        where: { folderPath: modelDir.folderPath },
        update: { name: modelDir.name, studioId: studio.id },
        create: { name: modelDir.name, folderPath: modelDir.folderPath, studioId: studio.id },
      });
      modelCount += 1;
      seenModelPaths.add(modelDir.folderPath);

      const renderDirName = await findChildDir(modelDir.absolutePath, "Render");
      if (renderDirName) {
        const renderPath = path.join(modelDir.absolutePath, renderDirName);
        const files = await listFiles(renderPath);
        for (const file of files) {
          if (!IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
          const relativePath = `${modelDir.folderPath}/${renderDirName}/${file}`;
          await prisma.render.upsert({
            where: { relativePath },
            update: { filename: file, modelId: model.id },
            create: { filename: file, relativePath, modelId: model.id },
          });
          renderCount += 1;
          seenRenderPaths.add(relativePath);
        }
      }
    }
  }

  console.log("[scan] Nettoyage des entrees obsoletes en base");
  await prisma.render.deleteMany({ where: { relativePath: { notIn: Array.from(seenRenderPaths) } } });
  await prisma.model3D.deleteMany({ where: { folderPath: { notIn: Array.from(seenModelPaths) } } });
  await prisma.studio.deleteMany({ where: { name: { notIn: studioNames } } });

  console.log(
    `[scan] Termine : ${studioCount} studio(s), ${modelCount} modele(s), ${renderCount} render(s)`,
  );

  return { studios: studioCount, models: modelCount, renders: renderCount };
}
