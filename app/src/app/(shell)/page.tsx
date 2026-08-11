import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getModels() {
  return prisma.model3D.findMany({
    orderBy: { name: "asc" },
    include: {
      renders: { take: 1, orderBy: { filename: "asc" } },
    },
  });
}

export default async function HomePage() {
  const models = await getModels();

  if (models.length === 0) {
    return (
      <div>
        <h1>Library3D</h1>
        <p>
          Aucun modele en base pour le moment. Lance un scan depuis{" "}
          <a href="/admin">l&apos;administration</a>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Library3D</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        {models.map((model) => {
          const cover = model.renders[0];
          return (
            <div
              key={model.id}
              style={{
                border: "1px solid #262626",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  aspectRatio: "1 / 1",
                  backgroundColor: "#1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/renders/${cover.relativePath}`}
                    alt={model.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "#555" }}>Pas de photo</span>
                )}
              </div>
              <p style={{ padding: "0.5rem 0.75rem", margin: 0 }}>{model.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
