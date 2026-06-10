import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useLeaderboard } from "../hooks/useLeaderboard";

export function LeaderboardTab({ quinielaId }: { quinielaId: number }) {
  const { data: tabla, isLoading, isError } = useLeaderboard(quinielaId);

  if (isLoading) return <p className="text-muted-foreground">Cargando tabla...</p>;
  if (isError) return <p className="text-destructive">No se pudo cargar la tabla.</p>;

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Participante</TableHead>
            <TableHead className="text-right">Puntos</TableHead>
            <TableHead className="text-right">Exactos</TableHead>
            <TableHead className="text-right">Evaluadas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tabla?.map((entry) => (
            <TableRow key={entry.usuario_id}>
              <TableCell className="font-medium">
                {entry.posicion === 1 ? "🏆" : entry.posicion}
              </TableCell>
              <TableCell>{entry.nombre}</TableCell>
              <TableCell className="text-right font-semibold">{entry.puntos_total}</TableCell>
              <TableCell className="text-right">{entry.aciertos_exactos}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {entry.predicciones_evaluadas}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t p-2 text-xs text-muted-foreground">
        Desempate: puntos → marcadores exactos → nombre.
      </p>
    </div>
  );
}
