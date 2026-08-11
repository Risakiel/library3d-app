export function Topbar() {
  return (
    <header className="flex items-center border-b border-border bg-card px-8 py-4">
      <form action="/" method="get" className="w-full max-w-sm">
        <input
          type="search"
          name="q"
          placeholder="Rechercher un modele..."
          className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </form>
    </header>
  );
}
