import { useParams } from "react-router";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTab } from "@/features/leaderboard/components/LeaderboardTab";
import { PrediccionesTab } from "@/features/predicciones/components/PrediccionesTab";

import { useQuiniela } from "../hooks/useQuinielas";

export default function QuinielaDetailPage() {
  const params = useParams<{ id: string }>();
  const quinielaId = Number(params.id);
  const { data: quiniela, isLoading, isError } = useQuiniela(quinielaId);

  if (Number.isNaN(quinielaId)) return <p className="text-destructive">Quiniela inválida.</p>;
  if (isLoading) return <p className="text-muted-foreground">Cargando quiniela...</p>;
  if (isError || quiniela === undefined) {
    return <p className="text-destructive">No se encontró la quiniela.</p>;
  }

  const copiarCodigo = () => {
    void navigator.clipboard.writeText(quiniela.codigo_invitacion);
    toast.success("Código copiado");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{quiniela.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {quiniela.participantes} participante{quiniela.participantes === 1 ? "" : "s"} · Tus
            puntos: <span className="font-semibold">{quiniela.mis_puntos}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {quiniela.codigo_invitacion}
          </Badge>
          <Button variant="outline" size="sm" onClick={copiarCodigo}>
            Copiar código
          </Button>
        </div>
      </div>

      <Tabs defaultValue="predicciones">
        <TabsList>
          <TabsTrigger value="predicciones">Partidos y mis predicciones</TabsTrigger>
          <TabsTrigger value="leaderboard">Tabla de posiciones</TabsTrigger>
        </TabsList>
        <TabsContent value="predicciones" className="mt-4">
          <PrediccionesTab quinielaId={quinielaId} />
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardTab quinielaId={quinielaId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
