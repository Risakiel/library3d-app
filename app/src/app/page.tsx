import fs from "node:fs/promises";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NAS_ROOT = "/library3d";

async function getStatus() {
  let dbOk = true;
  let modelCount = 0;
  try {
    modelCount = await prisma.model3D.count();
  } catch {
    dbOk = false;
  }

  let nasOk = true;
  let nasFolders: string[] = [];
  try {
    const entries = await fs.readdir(NAS_ROOT, { withFileTypes: true });
    nasFolders = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    nasOk = false;
  }

  return { dbOk, modelCount, nasOk, nasFolders };
}

export default async function HomePage() {
  const { dbOk, modelCount, nasOk, nasFolders } = await getStatus();

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>Library3D</h1>
      <p>Etape 1 : verification que les deux conteneurs (site + base de donnees) communiquent bien.</p>

      <h2>Etat du systeme</h2>
      <ul>
        <li>
          Base de donnees : {dbOk ? `connectee (${modelCount} modele(s) enregistre(s))` : "erreur de connexion"}
        </li>
        <li>
          Acces NAS ({NAS_ROOT}) :{" "}
          {nasOk ? `${nasFolders.length} dossier(s) detecte(s)` : "erreur de lecture du point de montage"}
        </li>
      </ul>

      {nasOk && nasFolders.length > 0 && (
        <>
          <h3>Dossiers detectes dans Library3D</h3>
          <ul>
            {nasFolders.map((folder) => (
              <li key={folder}>{folder}</li>
            ))}
          </ul>
        </>
      )}

      <p>
        <a href="/admin">Acceder a l&apos;administration</a>
      </p>
    </main>
  );
}
