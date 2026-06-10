import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePartidos } from "@/features/partidos/hooks/usePartidos";
import {
  formatearFecha,
  type Partido,
  partidoComenzo,
} from "@/features/partidos/schemas/partido.schema";
import {
  type PrediccionForm,
  prediccionFormSchema,
} from "@/features/predicciones/schemas/prediccion.schema";

import { useRegistrarResultado } from "../hooks/useRegistrarResultado";

function ResultadoForm({ partido }: { partido: Partido }) {
  const registrarMutation = useRegistrarResultado();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PrediccionForm>({
    resolver: zodResolver(prediccionFormSchema),
    defaultValues: {
      golesLocal: partido.goles_local ?? 0,
      golesVisitante: partido.goles_visitante ?? 0,
    },
  });

  const onSubmit = handleSubmit(async (datos) => {
    try {
      await registrarMutation.mutateAsync({
        partidoId: partido.id,
        goles_local: datos.golesLocal,
        goles_visitante: datos.golesVisitante,
      });
      toast.success(`Resultado guardado: ${partido.equipo_local} ${datos.golesLocal}-${datos.golesVisitante} ${partido.equipo_visitante}`);
    } catch {
      toast.error("No se pudo guardar el resultado");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-1" noValidate>
      <label className="sr-only" htmlFor={`rl-${partido.id}`}>
        Goles {partido.equipo_local}
      </label>
      <Input
        id={`rl-${partido.id}`}
        type="number"
        min={0}
        max={20}
        className="w-14 text-center"
        {...register("golesLocal", { valueAsNumber: true })}
      />
      <span aria-hidden>-</span>
      <label className="sr-only" htmlFor={`rv-${partido.id}`}>
        Goles {partido.equipo_visitante}
      </label>
      <Input
        id={`rv-${partido.id}`}
        type="number"
        min={0}
        max={20}
        className="w-14 text-center"
        {...register("golesVisitante", { valueAsNumber: true })}
      />
      <Button type="submit" size="sm" variant={partido.goles_local !== null ? "outline" : "default"} disabled={isSubmitting}>
        {partido.goles_local !== null ? "Corregir" : "Guardar"}
      </Button>
    </form>
  );
}

export default function AdminResultadosPage() {
  const { data: partidos, isLoading, isError } = usePartidos();

  if (isLoading) return <p className="text-muted-foreground">Cargando partidos...</p>;
  if (isError) return <p className="text-destructive">No se pudieron cargar los partidos.</p>;

  // Solo partidos ya comenzados pueden recibir resultado (el backend lo exige igual)
  const comenzados = (partidos ?? []).filter(partidoComenzo);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Cargar resultados</h1>
        <p className="text-sm text-muted-foreground">
          Solo aparecen partidos que ya comenzaron. Guardar un resultado recalcula los puntos de
          todas las quinielas; puedes corregirlo y se recalcula de nuevo.
        </p>
      </div>
      {comenzados.length === 0 && (
        <p className="rounded-lg border bg-background p-6 text-center text-muted-foreground">
          Ningún partido ha comenzado todavía.
        </p>
      )}
      <div className="space-y-2">
        {comenzados.map((partido) => (
          <div
            key={partido.id}
            className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs text-muted-foreground">
                #{partido.numero} · {partido.fase}
                {partido.grupo !== null ? ` · Grupo ${partido.grupo}` : ""} ·{" "}
                {formatearFecha(partido.fecha_hora)}
              </p>
              <p className="font-medium">
                {partido.equipo_local} <span className="text-muted-foreground">vs</span>{" "}
                {partido.equipo_visitante}
              </p>
            </div>
            <ResultadoForm partido={partido} />
          </div>
        ))}
      </div>
    </div>
  );
}
