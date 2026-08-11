interface LoginPageProps {
  searchParams: { next?: string; error?: string };
}

export default function AdminLoginPage({ searchParams }: LoginPageProps) {
  const next = searchParams.next || "/admin";

  return (
    <main style={{ padding: "2rem", maxWidth: 360, margin: "0 auto" }}>
      <h1>Connexion administration</h1>

      {searchParams.error === "1" && <p style={{ color: "#ff6b6b" }}>Identifiants incorrects.</p>}

      <form action="/api/admin/login" method="post" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input type="hidden" name="next" value={next} />
        <label>
          Nom d&apos;utilisateur
          <input type="text" name="username" required autoFocus style={{ display: "block", width: "100%" }} />
        </label>
        <label>
          Mot de passe
          <input type="password" name="password" required style={{ display: "block", width: "100%" }} />
        </label>
        <button type="submit">Se connecter</button>
      </form>
    </main>
  );
}
