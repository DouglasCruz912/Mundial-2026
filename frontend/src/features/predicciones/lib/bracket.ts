import type { Partido } from "@/features/partidos/schemas/partido.schema";

import type { Prediccion } from "../schemas/prediccion.schema";

// Resuelve los cruces de eliminatorias usando LAS PREDICCIONES DEL USUARIO:
// tablas de grupo (pts → dif. de gol → goles a favor → nombre), mejores 8
// terceros, y ganador/perdedor de cada llave según el marcador predicho.
// Es una simulación personal: cambiará con los resultados reales.

const RE_POSICION = /^([12])° Grupo ([A-L])$/;
const RE_TERCEROS = /^3° Grupo ([A-L/]+)$/;
const RE_GANADOR = /^Ganador P(\d+)$/;
const RE_PERDEDOR = /^Perdedor P(\d+)$/;

type Fila = { equipo: string; grupo: string; pts: number; dg: number; gf: number };

function compararFilas(a: Fila, b: Fila): number {
  if (a.pts !== b.pts) return b.pts - a.pts;
  if (a.dg !== b.dg) return b.dg - a.dg;
  if (a.gf !== b.gf) return b.gf - a.gf;
  return a.equipo.localeCompare(b.equipo);
}

/** Tabla de un grupo según predicciones; null si falta predecir algún partido. */
function tablaGrupo(
  partidosGrupo: Partido[],
  prediccionPorPartido: Map<number, Prediccion>,
): Fila[] | null {
  const filas = new Map<string, Fila>();
  const grupo = partidosGrupo[0]?.grupo ?? "";
  for (const partido of partidosGrupo) {
    for (const equipo of [partido.equipo_local, partido.equipo_visitante]) {
      if (!filas.has(equipo)) filas.set(equipo, { equipo, grupo, pts: 0, dg: 0, gf: 0 });
    }
    const pred = prediccionPorPartido.get(partido.id);
    if (pred === undefined) return null; // grupo incompleto: no se simula
    const local = filas.get(partido.equipo_local)!;
    const visitante = filas.get(partido.equipo_visitante)!;
    local.gf += pred.goles_local;
    local.dg += pred.goles_local - pred.goles_visitante;
    visitante.gf += pred.goles_visitante;
    visitante.dg += pred.goles_visitante - pred.goles_local;
    if (pred.goles_local > pred.goles_visitante) local.pts += 3;
    else if (pred.goles_local < pred.goles_visitante) visitante.pts += 3;
    else {
      local.pts += 1;
      visitante.pts += 1;
    }
  }
  return [...filas.values()].sort(compararFilas);
}

export type EquiposResueltos = Map<number, { local: string | null; visitante: string | null }>;

export function resolverBracket(
  partidos: Partido[],
  prediccionPorPartido: Map<number, Prediccion>,
): EquiposResueltos {
  const resultado: EquiposResueltos = new Map();

  // 1. Tablas de grupo simuladas
  const tablas = new Map<string, Fila[]>();
  const porGrupo = new Map<string, Partido[]>();
  for (const p of partidos) {
    if (p.fase === "grupos" && p.grupo !== null) {
      const lista = porGrupo.get(p.grupo) ?? [];
      lista.push(p);
      porGrupo.set(p.grupo, lista);
    }
  }
  for (const [grupo, partidosGrupo] of porGrupo) {
    const tabla = tablaGrupo(partidosGrupo, prediccionPorPartido);
    if (tabla !== null) tablas.set(grupo, tabla);
  }

  // 2. Mejores 8 terceros (solo si los 12 grupos están completos)
  let tercerosClasificados: Fila[] = [];
  if (tablas.size === 12) {
    tercerosClasificados = [...tablas.values()]
      .map((t) => t[2])
      .filter((f): f is Fila => f !== undefined)
      .sort(compararFilas)
      .slice(0, 8);
  }
  const tercerosAsignados = new Set<string>();

  // 3. Eliminatorias en orden: las referencias (P74) siempre apuntan hacia atrás
  const eliminatorias = partidos
    .filter((p) => p.fase !== "grupos")
    .sort((a, b) => a.numero - b.numero);
  // ganador/perdedor simulado por número de partido
  const avance = new Map<number, { ganador: string | null; perdedor: string | null }>();

  const resolverEtiqueta = (etiqueta: string): string | null => {
    let m = RE_POSICION.exec(etiqueta);
    if (m !== null) {
      const fila = tablas.get(m[2])?.[Number(m[1]) - 1];
      return fila?.equipo ?? null;
    }
    m = RE_TERCEROS.exec(etiqueta);
    if (m !== null) {
      const permitidos = new Set(m[1].split("/"));
      const elegido = tercerosClasificados.find(
        (f) => permitidos.has(f.grupo) && !tercerosAsignados.has(f.equipo),
      );
      if (elegido === undefined) return null;
      tercerosAsignados.add(elegido.equipo);
      return elegido.equipo;
    }
    m = RE_GANADOR.exec(etiqueta);
    if (m !== null) return avance.get(Number(m[1]))?.ganador ?? null;
    m = RE_PERDEDOR.exec(etiqueta);
    if (m !== null) return avance.get(Number(m[1]))?.perdedor ?? null;
    return null; // ya es un equipo real (seed actualizado): no tocar
  };

  for (const partido of eliminatorias) {
    const local = resolverEtiqueta(partido.equipo_local);
    const visitante = resolverEtiqueta(partido.equipo_visitante);
    resultado.set(partido.id, { local, visitante });

    const pred = prediccionPorPartido.get(partido.id);
    if (local !== null && visitante !== null && pred !== undefined) {
      if (pred.goles_local > pred.goles_visitante) {
        avance.set(partido.numero, { ganador: local, perdedor: visitante });
      } else if (pred.goles_local < pred.goles_visitante) {
        avance.set(partido.numero, { ganador: visitante, perdedor: local });
      }
      // empate: no define quién avanza
    }
  }

  return resultado;
}
