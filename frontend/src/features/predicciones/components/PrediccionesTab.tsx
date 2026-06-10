import { usePartidos } from "@/features/partidos/hooks/usePartidos";

import { useMisPredicciones } from "../hooks/usePredicciones";
import { resolverBracket } from "../lib/bracket";
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
  // Cruces de eliminatorias simulados con las predicciones del usuario
  const equiposResueltos = resolverBracket(partidos, prediccionPorPartido);
  const haySimulados = [...equiposResueltos.values()].some(
    (r) => r.local !== null || r.visitante !== null,
  );

  return (
    <div className="space-y-2">
      {haySimulados && (
        <p className="rounded-lg border border-dashed bg-muted/40 p-2 text-xs text-muted-foreground">
          Los equipos de eliminatorias marcados con * salen de <strong>tus predicciones</strong>{" "}
          (tablas simuladas y ganadores de cada llave). Se ajustarán con los resultados reales.
        </p>
      )}
      {partidos.map((partido) => (
        <PartidoPrediccionRow
          key={partido.id}
          quinielaId={quinielaId}
          partido={partido}
          prediccion={prediccionPorPartido.get(partido.id)}
          equiposSimulados={equiposResueltos.get(partido.id)}
        />
      ))}
    </div>
  );
}
