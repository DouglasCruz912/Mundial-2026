import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/** Sin acentos y en minúsculas: "Mexico" encuentra "México". */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function PrediccionesTab({ quinielaId }: { quinielaId: number }) {
  const [vista, setVista] = useState<VistaId>("grupos");
  const [busqueda, setBusqueda] = useState("");
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
  const consulta = normalizar(busqueda.trim());
  // Con búsqueda activa se recorre TODO el torneo (incluye equipos simulados);
  // sin búsqueda, solo la fase de la vista seleccionada.
  const visibles =
    consulta !== ""
      ? partidos.filter((p) => {
          const simulados = equiposResueltos.get(p.id);
          return [
            p.equipo_local,
            p.equipo_visitante,
            simulados?.local ?? "",
            simulados?.visitante ?? "",
          ].some((equipo) => normalizar(equipo).includes(consulta));
        })
      : partidos.filter((p) => (vistaActual.fases as readonly string[]).includes(p.fase));

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
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="sr-only" htmlFor="buscar-pais">
          Buscar por país
        </label>
        <Input
          id="buscar-pais"
          type="search"
          placeholder="Buscar por país… (ej. México)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="h-8 w-56"
        />
        {busqueda !== "" && (
          <Button variant="ghost" size="sm" onClick={() => setBusqueda("")}>
            Limpiar
          </Button>
        )}
      </div>

      <div
        className={`flex flex-wrap gap-1.5 ${consulta !== "" ? "pointer-events-none opacity-50" : ""}`}
        role="tablist"
        aria-label="Fase del torneo"
      >
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
            .map((p) => {
              const simulados = equiposResueltos.get(p.id);
              const local = simulados?.local ?? p.equipo_local;
              const visitante = simulados?.visitante ?? p.equipo_visitante;
              return `#${p.numero} ${local} vs ${visitante}`;
            })
            .join(" · ")}
        </p>
      )}

      {consulta !== "" && visibles.length === 0 && (
        <p className="rounded-lg border bg-background p-4 text-center text-sm text-muted-foreground">
          Ningún partido coincide con «{busqueda}». Los cruces de eliminatorias solo aparecen
          cuando tu bracket ya tiene a ese país clasificado.
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
