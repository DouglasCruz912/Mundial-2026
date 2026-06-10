import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatearFecha,
  type Partido,
  partidoComenzo,
} from "@/features/partidos/schemas/partido.schema";
import { ApiError } from "@/lib/apiClient";
import { equipoConBandera } from "@/lib/banderas";

import { useGuardarPrediccion } from "../hooks/usePredicciones";
import {
  type Prediccion,
  type PrediccionForm,
  prediccionFormSchema,
} from "../schemas/prediccion.schema";

type Props = {
  quinielaId: number;
  partido: Partido;
  prediccion: Prediccion | undefined;
};

function PuntosBadge({ puntos }: { puntos: number | null }) {
  if (puntos === null) return <Badge variant="outline">Pendiente</Badge>;
  if (puntos === 3) return <Badge className="bg-green-600 text-white">+3 exacto</Badge>;
  if (puntos === 1) return <Badge className="bg-amber-500 text-white">+1 resultado</Badge>;
  return <Badge variant="secondary">0 pts</Badge>;
}

export function PartidoPrediccionRow({ quinielaId, partido, prediccion }: Props) {
  const bloqueado = partidoComenzo(partido) || partido.goles_local !== null;
  const guardarMutation = useGuardarPrediccion(quinielaId);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PrediccionForm>({
    resolver: zodResolver(prediccionFormSchema),
    defaultValues: {
      golesLocal: prediccion?.goles_local ?? 0,
      golesVisitante: prediccion?.goles_visitante ?? 0,
    },
  });

  const onSubmit = handleSubmit(async (datos) => {
    try {
      await guardarMutation.mutateAsync({
        partido_id: partido.id,
        goles_local: datos.golesLocal,
        goles_visitante: datos.golesVisitante,
      });
      toast.success("Predicción guardada");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("El partido ya comenzó: predicción cerrada");
      } else {
        toast.error("No se pudo guardar la predicción");
      }
    }
  });

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          #{partido.numero} · {partido.fase}
          {partido.grupo !== null ? ` · Grupo ${partido.grupo}` : ""} ·{" "}
          {formatearFecha(partido.fecha_hora)}
        </p>
        <p className="font-medium">
          {equipoConBandera(partido.equipo_local)}{" "}
          <span className="text-muted-foreground">vs</span>{" "}
          {equipoConBandera(partido.equipo_visitante)}
        </p>
        {partido.goles_local !== null && (
          <p className="text-sm">
            Resultado:{" "}
            <span className="font-semibold">
              {partido.goles_local} - {partido.goles_visitante}
            </span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {prediccion !== undefined && partido.goles_local !== null && (
          <PuntosBadge puntos={prediccion.puntos} />
        )}
        {bloqueado ? (
          prediccion !== undefined ? (
            <Badge variant="outline">
              Tu pronóstico: {prediccion.goles_local}-{prediccion.goles_visitante}
            </Badge>
          ) : (
            <Badge variant="outline">Sin predicción</Badge>
          )
        ) : (
          <form onSubmit={onSubmit} className="flex items-center gap-1" noValidate>
            <label className="sr-only" htmlFor={`gl-${partido.id}`}>
              Goles {partido.equipo_local}
            </label>
            <Input
              id={`gl-${partido.id}`}
              type="number"
              min={0}
              max={20}
              className="w-14 text-center"
              aria-invalid={errors.golesLocal !== undefined}
              {...register("golesLocal", { valueAsNumber: true })}
            />
            <span aria-hidden>-</span>
            <label className="sr-only" htmlFor={`gv-${partido.id}`}>
              Goles {partido.equipo_visitante}
            </label>
            <Input
              id={`gv-${partido.id}`}
              type="number"
              min={0}
              max={20}
              className="w-14 text-center"
              aria-invalid={errors.golesVisitante !== undefined}
              {...register("golesVisitante", { valueAsNumber: true })}
            />
            <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
              {prediccion !== undefined ? "Actualizar" : "Guardar"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
