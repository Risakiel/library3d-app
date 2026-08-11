import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

export const NAS_ROOT = "/library3d";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

export interface ScanResult {
  studios: number;
  models: number;
  renders: number;
  stlFiles: number;
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

export async function scanLibrary(): Promise<ScanResult> {
  const seenModelPaths = new Set<string>();
  const seenRenderPaths = new Set<string>();
  const seenStlPaths = new Set<string>();

  let studioCount = 0;
  let modelCount = 0;
  let renderCount = 0;
  let stlCount = 0;

  const studioNames = await listDirs(NAS_ROOT);

  for (const studioName of studioNames) {
    const studio = await prisma.studio.upsert({
      where: { name: studioName },
      update: {},
      create: { name: studioName },
    });
    studioCount += 1;

    const studioPath = path.join(NAS_ROOT, studioName);
    const modelNames = await listDirs(studioPath);

    for (const modelName of modelNames) {
      const folderPath = `${studioName}/${modelName}`;
      const modelPath = path.join(studioPath, modelName);

      const model = await prisma.model3D.upsert({
        where: { folderPath },
        update: { name: modelName, studioId: studio.id },
        create: { name: modelName, folderPath, studioId: studio.id },
      });
      modelCount += 1;
      seenModelPaths.add(folderPath);

      const renderDirName = await findChildDir(modelPath, "Render");
      if (renderDirName) {
        const renderPath = path.join(modelPath, renderDirName);
        const files = await listFiles(renderPath);
        for (const file of files) {
          if (!IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
          const relativePath = `${folderPath}/${renderDirName}/${file}`;
          await prisma.render.upsert({
            where: { relativePath },
            update: { filename: file, modelId: model.id },
            create: { filename: file, relativePath, modelId: model.id },
          });
          renderCount += 1;
          seenRenderPaths.add(relativePath);
        }
      }

      const stlDirName = await findChildDir(modelPath, "STL");
      if (stlDirName) {
        const stlPath = path.join(modelPath, stlDirName);
        const files = await listFiles(stlPath);
        for (const file of files) {
          const relativePath = `${folderPath}/${stlDirName}/${file}`;
          await prisma.stlFile.upsert({
            where: { relativePath },
            update: { filename: file, modelId: model.id },
            create: { filename: file, relativePath, modelId: model.id },
          });
          stlCount += 1;
          seenStlPaths.add(relativePath);
        }
      }
    }
  }

  await prisma.render.deleteMany({ where: { relativePath: { notIn: Array.from(seenRenderPaths) } } });
  await prisma.stlFile.deleteMany({ where: { relativePath: { notIn: Array.from(seenStlPaths) } } });
  await prisma.model3D.deleteMany({ where: { folderPath: { notIn: Array.from(seenModelPaths) } } });
  await prisma.studio.deleteMany({ where: { name: { notIn: studioNames } } });

  return { studios: studioCount, models: modelCount, renders: renderCount, stlFiles: stlCount };
}
