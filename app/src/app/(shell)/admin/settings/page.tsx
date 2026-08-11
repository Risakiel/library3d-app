import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NAS_ROOT } from "@/lib/scanner";

export default function SettingsPage() {
  const rows = [
    { label: "Chemin NAS monte dans le conteneur", value: NAS_ROOT },
    { label: "Nom d'utilisateur admin", value: process.env.ADMIN_USERNAME || "admin" },
    { label: "Environnement", value: process.env.NODE_ENV || "development" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parametres</h1>
        <p className="text-sm text-muted-foreground">
          Configuration actuelle (definie via les variables d&apos;environnement du conteneur).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-mono">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Pour changer le mot de passe admin ou le chemin NAS, modifie les variables d&apos;environnement du
        conteneur sur Unraid puis redemarre-le.
      </p>
    </div>
  );
}
