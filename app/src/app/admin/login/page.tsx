import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface LoginPageProps {
  searchParams: { next?: string; error?: string };
}

export default function AdminLoginPage({ searchParams }: LoginPageProps) {
  const next = searchParams.next || "/admin";

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Connexion administration</CardTitle>
        </CardHeader>
        <CardContent>
          {searchParams.error === "1" && (
            <p className="mb-4 text-sm text-destructive">Identifiants incorrects.</p>
          )}

          <form action="/api/admin/login" method="post" className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm">
                Nom d&apos;utilisateur
              </label>
              <Input id="username" type="text" name="username" required autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm">
                Mot de passe
              </label>
              <Input id="password" type="password" name="password" required />
            </div>
            <Button type="submit">Se connecter</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
