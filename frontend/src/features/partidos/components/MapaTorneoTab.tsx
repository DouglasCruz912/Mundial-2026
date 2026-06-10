import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bandera } from "@/components/Bandera";
import { useMisPredicciones } from "@/features/predicciones/hooks/usePredicciones";
import { cn } from "@/lib/utils";

import { usePartidos } from "../hooks/usePartidos";

const GRUPOS = "ABCDEFGHIJKL".split("");

const FASES_ELIMINATORIAS: { fase: string; etiqueta: string }[] = [
  { fase: "dieciseisavos", etiqueta: "Dieciseisavos" },
  { fase: "octavos", etiqueta: "Octavos" },
  { fase: "cuartos", etiqueta: "Cuartos" },
  { fase: "semifinal", etiqueta: "Semifinales" },
  { fase: "tercer_puesto", etiqueta: "3er puesto" },
  { fase: "final", etiqueta: "Final" },
];

function BarraProgreso({ valor, total, className }: { valor: number; total: number; className?: string }) {
  const porcentaje = total === 0 ? 0 : Math.round((valor / total) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={total}
      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-all", className)}
        style={{ width: `${porcentaje}%` }}
      />
    </div>
  );
}

type StatsGrupo = {
  equipos: string[];
  jugados: number;
  total: number;
  predichos: number;
  puntos: number;
};

export function MapaTorneoTab({ quinielaId }: { quinielaId: number }) {
  const partidosQuery = usePartidos();
  const prediccionesQuery = useMisPredicciones(quinielaId);

  if (partidosQuery.isLoading || prediccionesQuery.isLoading) {
    return <p className="text-muted-foreground">Cargando mapa del torneo...</p>;
  }
  if (partidosQuery.isError || prediccionesQuery.isError) {
    return <p className="text-destructive">No se pudo cargar el mapa del torneo.</p>;
  }

  const partidos = partidosQuery.data ?? [];
  const prediccionPorPartido = new Map(
    (prediccionesQuery.data ?? []).map((p) => [p.partido_id, p]),
  );

  // Derivado en render: estadísticas por grupo y por fase
  const statsPorGrupo = new Map<string, StatsGrupo>(
    GRUPOS.map((g) => [g, { equipos: [], jugados: 0, total: 0, predichos: 0, puntos: 0 }]),
  );
  const statsPorFase = new Map<string, { jugados: number; total: number; predichos: number }>(
    FASES_ELIMINATORIAS.map(({ fase }) => [fase, { jugados: 0, total: 0, predichos: 0 }]),
  );

  for (const partido of partidos) {
    const prediccion = prediccionPorPartido.get(partido.id);
    if (partido.fase === "grupos" && partido.grupo !== null) {
      const stats = statsPorGrupo.get(partido.grupo);
      if (stats === undefined) continue;
      stats.total += 1;
      if (partido.goles_local !== null) stats.jugados += 1;
      if (prediccion !== undefined) {
        stats.predichos += 1;
        stats.puntos += prediccion.puntos ?? 0;
      }
      for (const equipo of [partido.equipo_local, partido.equipo_visitante]) {
        if (!stats.equipos.includes(equipo)) stats.equipos.push(equipo);
      }
    } else {
      const stats = statsPorFase.get(partido.fase);
      if (stats === undefined) continue;
      stats.total += 1;
      if (partido.goles_local !== null) stats.jugados += 1;
      if (prediccion !== undefined) stats.predichos += 1;
    }
  }

  const faseGruposCompleta = [...statsPorGrupo.values()].every((s) => s.jugados === s.total);

  return (
    <div className="space-y-6">
      <section aria-labelledby="titulo-grupos" className="space-y-3">
        <h2 id="titulo-grupos" className="text-lg font-semibold">
          Fase de grupos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GRUPOS.map((grupo) => {
            const stats = statsPorGrupo.get(grupo);
            if (stats === undefined) return null;
            return (
              <Card key={grupo} className="gap-2 py-4">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center justify-between text-base">
                    Grupo {grupo}
                    {stats.predichos > 0 && (
                      <Badge variant="secondary">{stats.puntos} pts</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                    {stats.equipos.map((equipo) => (
                      <li
                        key={equipo}
                        className="flex items-center gap-1.5 truncate"
                        title={equipo}
                      >
                        <Bandera equipo={equipo} />
                        <span className="truncate">{equipo}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Jugados {stats.jugados}/{stats.total}</span>
                      <span>Predichos {stats.predichos}/{stats.total}</span>
                    </div>
                    <BarraProgreso valor={stats.jugados} total={stats.total} />
                    <BarraProgreso
                      valor={stats.predichos}
                      total={stats.total}
                      className="bg-amber-500"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="titulo-fases" className="space-y-3">
        <h2 id="titulo-fases" className="text-lg font-semibold">
          Fases eliminatorias
        </h2>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {FASES_ELIMINATORIAS.map(({ fase, etiqueta }, i) => {
            const stats = statsPorFase.get(fase);
            if (stats === undefined) return null;
            const activa =
              faseGruposCompleta &&
              FASES_ELIMINATORIAS.slice(0, i).every(
                (f) => statsPorFase.get(f.fase)?.jugados === statsPorFase.get(f.fase)?.total,
              );
            return (
              <Card
                key={fase}
                className={cn("gap-1 py-3", !activa && stats.jugados === 0 && "opacity-60")}
              >
                <CardContent className="space-y-1 text-center">
                  <p className="text-sm font-medium">{etiqueta}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.jugados}/{stats.total} jugados
                  </p>
                  <BarraProgreso valor={stats.jugados} total={stats.total} />
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Barra oscura: partidos jugados · Barra ámbar: tus predicciones hechas. Los cruces de
          eliminatorias se completan al avanzar el torneo.
        </p>
      </section>
    </div>
  );
}
