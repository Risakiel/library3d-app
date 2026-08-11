interface AdminPageProps {
  searchParams: {
    scanned?: string;
    studios?: string;
    models?: string;
    renders?: string;
  };
}

export default function AdminPage({ searchParams }: AdminPageProps) {
  const scanned = searchParams.scanned === "1";

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Administration Library3D</h1>
      <p>Zone protegee par mot de passe.</p>

      <form action="/admin/scan" method="post">
        <button type="submit">Scanner le NAS</button>
      </form>

      {scanned && (
        <ul>
          <li>Studios : {searchParams.studios}</li>
          <li>Modeles : {searchParams.models}</li>
          <li>Renders : {searchParams.renders}</li>
        </ul>
      )}
    </div>
  );
}
