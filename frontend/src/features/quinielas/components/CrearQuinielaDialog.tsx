import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useCrearQuiniela } from "../hooks/useQuinielas";
import { type CrearQuinielaForm, crearQuinielaSchema } from "../schemas/quiniela.schema";

export function CrearQuinielaDialog() {
  const [open, setOpen] = useState(false);
  const crearMutation = useCrearQuiniela();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CrearQuinielaForm>({ resolver: zodResolver(crearQuinielaSchema) });

  const onSubmit = handleSubmit(async (datos) => {
    try {
      const quiniela = await crearMutation.mutateAsync(datos);
      toast.success(`Quiniela creada. Código: ${quiniela.codigo_invitacion}`);
      reset();
      setOpen(false);
    } catch {
      toast.error("No se pudo crear la quiniela");
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Crear quiniela</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva quiniela</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" placeholder="La quiniela de la oficina" {...register("nombre")} />
            {errors.nombre && (
              <p role="alert" className="text-sm text-destructive">
                {errors.nombre.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Input id="descripcion" {...register("descripcion")} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
