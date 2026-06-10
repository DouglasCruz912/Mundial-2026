import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useQuinielas } from "../hooks/useQuinielas";
import { CrearQuinielaDialog } from "./CrearQuinielaDialog";
import { UnirseQuinielaDialog } from "./UnirseQuinielaDialog";

export default function DashboardPage() {
  const { data: quinielas, isLoading, isError } = useQuinielas();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Mis quinielas</h1>
        <div className="flex gap-2">
          <UnirseQuinielaDialog />
          <CrearQuinielaDialog />
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">Cargando quinielas...</p>}
      {isError && <p className="text-destructive">No se pudieron cargar las quinielas.</p>}

      {quinielas !== undefined && quinielas.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no participas en ninguna quiniela. Crea una o únete con un código.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {quinielas?.map((q) => (
          <Link key={q.id} to={`/quinielas/${q.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  {q.nombre}
                  <Badge variant="secondary">{q.mis_puntos} pts</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  {q.participantes} participante{q.participantes === 1 ? "" : "s"} · Código:{" "}
                  <span className="font-mono">{q.codigo_invitacion}</span>
                </p>
                {q.descripcion !== null && q.descripcion !== "" && <p>{q.descripcion}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
