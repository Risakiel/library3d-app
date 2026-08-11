import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

export const NAS_ROOT = "/library3d";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

export interface ScanResult {
  sources: number;
  models: number;
  renders: number;
}

interface ModelDir {
  name: string;
  folderPath: string;
  absolutePath: string;
  sourceName: string;
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
 * la presence d'un sous-dossier Render ou STL). Le "Source" d'un modele est
 * toujours son dossier parent direct - ce qui deduplique naturellement les
 * createurs qu'ils soient a la racine ("Bulkamancer") ou niches sous une
 * marketplace ("CGTrader/Bulkamancer").
 */
async function collectModelDirs(dirPath: string, relativePrefix: string): Promise<ModelDir[]> {
  const subDirNames = await listDirs(dirPath);
  const results: ModelDir[] = [];

  for (const subDirName of subDirNames) {
    const subPath = path.join(dirPath, subDirName);
    const folderPath = relativePrefix ? `${relativePrefix}/${subDirName}` : subDirName;

    const isModelDir =
      (await findChildDir(subPath, "Render")) !== undefined ||
      (await findChildDir(subPath, "STL")) !== undefined;

    if (isModelDir) {
      results.push({
        name: subDirName,
        folderPath,
        absolutePath: subPath,
        sourceName: path.basename(dirPath),
      });
    } else {
      results.push(...(await collectModelDirs(subPath, folderPath)));
    }
  }

  return results;
}

export async function scanLibrary(): Promise<ScanResult> {
  const seenModelPaths = new Set<string>();
  const seenRenderPaths = new Set<string>();
  const seenSourceNames = new Set<string>();

  let renderCount = 0;

  console.log(`[scan] Debut du scan de ${NAS_ROOT}`);

  const modelDirs = await collectModelDirs(NAS_ROOT, "");
  console.log(`[scan] ${modelDirs.length} modele(s) trouve(s)`);

  for (const modelDir of modelDirs) {
    const source = await prisma.source.upsert({
      where: { name: modelDir.sourceName },
      update: {},
      create: { name: modelDir.sourceName },
    });
    seenSourceNames.add(modelDir.sourceName);

    const model = await prisma.model3D.upsert({
      where: { folderPath: modelDir.folderPath },
      update: { name: modelDir.name, sourceId: source.id },
      create: { name: modelDir.name, folderPath: modelDir.folderPath, sourceId: source.id },
    });
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

  console.log("[scan] Nettoyage des entrees obsoletes en base");
  await prisma.render.deleteMany({ where: { relativePath: { notIn: Array.from(seenRenderPaths) } } });
  await prisma.model3D.deleteMany({ where: { folderPath: { notIn: Array.from(seenModelPaths) } } });
  await prisma.source.deleteMany({ where: { name: { notIn: Array.from(seenSourceNames) } } });

  const result = { sources: seenSourceNames.size, models: modelDirs.length, renders: renderCount };
  console.log(
    `[scan] Termine : ${result.sources} source(s), ${result.models} modele(s), ${result.renders} render(s)`,
  );
  return result;
}

export async function runScanJob(trigger: "manual" | "scheduled") {
  const log = await prisma.scanLog.create({ data: { trigger } });

  try {
    const result = await scanLibrary();
    await prisma.scanLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        success: true,
        sourceCount: result.sources,
        modelCount: result.models,
        renderCount: result.renders,
      },
    });
    return result;
  } catch (error) {
    console.error("[scan] Echec du scan", error);
    await prisma.scanLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
