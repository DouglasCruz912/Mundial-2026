import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePartidos } from "@/features/partidos/hooks/usePartidos";

import { useMisPredicciones } from "../hooks/usePredicciones";
import { resolverBracket } from "../lib/bracket";
import { PartidoPrediccionRow } from "./PartidoPrediccionRow";

const VISTAS = [
  { id: "grupos", etiqueta: "Grupos", fases: ["grupos"] },
  { id: "dieciseisavos", etiqueta: "Dieciseisavos", fases: ["dieciseisavos"] },
  { id: "octavos", etiqueta: "Octavos", fases: ["octavos"] },
  { id: "cuartos", etiqueta: "Cuartos", fases: ["cuartos"] },
  { id: "final", etiqueta: "Semis y Final", fases: ["semifinal", "tercer_puesto", "final"] },
] as const;

type VistaId = (typeof VISTAS)[number]["id"];

export function PrediccionesTab({ quinielaId }: { quinielaId: number }) {
  const [vista, setVista] = useState<VistaId>("grupos");
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
  // Cruces de eliminatorias simulados con TODAS las predicciones del usuario
  const equiposResueltos = resolverBracket(partidos, prediccionPorPartido);

  const vistaActual = VISTAS.find((v) => v.id === vista) ?? VISTAS[0];
  const visibles = partidos.filter((p) =>
    (vistaActual.fases as readonly string[]).includes(p.fase),
  );

  const conteo = (fases: readonly string[]) => {
    const delGrupo = partidos.filter((p) => fases.includes(p.fase));
    const predichos = delGrupo.filter((p) => prediccionPorPartido.has(p.id)).length;
    return { predichos, total: delGrupo.length };
  };

  // Partidos de la vista actual sin predicción (para señalar qué falta)
  const faltantes = visibles.filter(
    (p) => !prediccionPorPartido.has(p.id) && p.goles_local === null,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Fase del torneo">
        {VISTAS.map((v) => {
          const { predichos, total } = conteo(v.fases);
          const completo = predichos === total && total > 0;
          return (
            <Button
              key={v.id}
              role="tab"
              aria-selected={vista === v.id}
              variant={vista === v.id ? "default" : "outline"}
              size="sm"
              onClick={() => setVista(v.id)}
            >
              {v.etiqueta}
              <Badge
                variant={vista === v.id ? "secondary" : "outline"}
                className={completo ? "border-green-600 text-green-600" : ""}
              >
                {completo ? "✓" : `${predichos}/${total}`}
              </Badge>
            </Button>
          );
        })}
      </div>

      {vista !== "grupos" && (
        <p className="rounded-lg border border-dashed bg-muted/40 p-2 text-xs text-muted-foreground">
          Los equipos con * salen de <strong>tus predicciones</strong> (tablas simuladas y
          ganadores de cada llave); se ajustarán con los resultados reales. Si un cruce sigue
          mostrando «1° Grupo E» o «3° Grupo …», te falta completar predicciones de esos grupos
          o definir el ganador de la llave anterior.
        </p>
      )}

      {faltantes.length > 0 && faltantes.length <= 10 && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
          Te falta{faltantes.length === 1 ? "" : "n"} por predecir:{" "}
          {faltantes
            .map((p) => `#${p.numero} ${p.equipo_local} vs ${p.equipo_visitante}`)
            .join(" · ")}
        </p>
      )}

      <div className="space-y-2">
        {visibles.map((partido) => (
          <PartidoPrediccionRow
            key={partido.id}
            quinielaId={quinielaId}
            partido={partido}
            prediccion={prediccionPorPartido.get(partido.id)}
            equiposSimulados={equiposResueltos.get(partido.id)}
          />
        ))}
      </div>
    </div>
  );
}
