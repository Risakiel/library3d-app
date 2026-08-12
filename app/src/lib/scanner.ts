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
  marketplaceName: string | null;
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
 * marketplace ("CGTrader/Bulkamancer"). Le dossier de tout premier niveau est
 * conserve a part : s'il differe du parent direct, c'est une marketplace
 * (ex: "CGTrader"), sinon il n'y a pas de marketplace (createur direct).
 */
async function collectModelDirs(
  dirPath: string,
  relativePrefix: string,
  topLevelName: string | null,
): Promise<ModelDir[]> {
  const subDirNames = await listDirs(dirPath);
  const results: ModelDir[] = [];

  for (const subDirName of subDirNames) {
    const subPath = path.join(dirPath, subDirName);
    const folderPath = relativePrefix ? `${relativePrefix}/${subDirName}` : subDirName;
    const currentTopLevel = topLevelName ?? subDirName;

    const isModelDir =
      (await findChildDir(subPath, "Render")) !== undefined ||
      (await findChildDir(subPath, "STL")) !== undefined;

    if (isModelDir) {
      const sourceName = path.basename(dirPath);
      results.push({
        name: subDirName,
        folderPath,
        absolutePath: subPath,
        sourceName,
        marketplaceName: currentTopLevel !== sourceName ? currentTopLevel : null,
      });
    } else {
      results.push(...(await collectModelDirs(subPath, folderPath, currentTopLevel)));
    }
  }

  return results;
}

async function upsertAutoTag(name: string, color: "RED" | "GREEN") {
  return prisma.tag.upsert({
    where: { name },
    update: { color },
    create: { name, color },
  });
}

export async function scanLibrary(): Promise<ScanResult> {
  const seenModelPaths = new Set<string>();
  const seenRenderPaths = new Set<string>();
  const seenSourceNames = new Set<string>();

  let renderCount = 0;

  console.log(`[scan] Debut du scan de ${NAS_ROOT}`);

  const defaultStatus = await prisma.status.findFirst({ where: { isDefault: true } });
  const modelDirs = await collectModelDirs(NAS_ROOT, "", null);
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
      create: {
        name: modelDir.name,
        folderPath: modelDir.folderPath,
        sourceId: source.id,
        statusId: defaultStatus?.id,
      },
    });
    seenModelPaths.add(modelDir.folderPath);

    const creatorTag = await upsertAutoTag(modelDir.sourceName, "GREEN");
    const autoTagIds = [creatorTag.id];
    if (modelDir.marketplaceName) {
      const marketplaceTag = await upsertAutoTag(modelDir.marketplaceName, "RED");
      autoTagIds.push(marketplaceTag.id);
    }
    await prisma.model3D.update({
      where: { id: model.id },
      data: { tags: { connect: autoTagIds.map((id) => ({ id })) } },
    });

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
