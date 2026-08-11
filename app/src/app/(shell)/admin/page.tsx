import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration Library3D</h1>
        <p className="text-muted-foreground">Zone protegee par mot de passe.</p>
      </div>

      <form action="/admin/scan" method="post">
        <Button type="submit">Scanner le NAS</Button>
      </form>

      {scanned && (
        <Card>
          <CardContent className="grid grid-cols-3 gap-4 p-4 text-center">
            <div>
              <p className="text-2xl font-bold">{searchParams.studios}</p>
              <p className="text-xs text-muted-foreground">Studios</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{searchParams.models}</p>
              <p className="text-xs text-muted-foreground">Modeles</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{searchParams.renders}</p>
              <p className="text-xs text-muted-foreground">Renders</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
