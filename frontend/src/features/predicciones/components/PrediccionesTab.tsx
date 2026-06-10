import { usePartidos } from "@/features/partidos/hooks/usePartidos";

import { useMisPredicciones } from "../hooks/usePredicciones";
import { PartidoPrediccionRow } from "./PartidoPrediccionRow";

export function PrediccionesTab({ quinielaId }: { quinielaId: number }) {
  const partidosQuery = usePartidos();
  const prediccionesQuery = useMisPredicciones(quinielaId);

  if (partidosQuery.isLoading || prediccionesQuery.isLoading) {
    return <p className="text-muted-foreground">Cargando partidos...</p>;
  }
  if (partidosQuery.isError || prediccionesQuery.isError) {
    return <p className="text-destructive">No se pudieron cargar los partidos.</p>;
  }

  const partidos = partidosQuery.data ?? [];
  // Derivado en render (sin useEffect): mapa partido_id -> predicción
  const prediccionPorPartido = new Map(
    (prediccionesQuery.data ?? []).map((p) => [p.partido_id, p]),
  );

  return (
    <div className="space-y-2">
      {partidos.map((partido) => (
        <PartidoPrediccionRow
          key={partido.id}
          quinielaId={quinielaId}
          partido={partido}
          prediccion={prediccionPorPartido.get(partido.id)}
        />
      ))}
    </div>
  );
}
