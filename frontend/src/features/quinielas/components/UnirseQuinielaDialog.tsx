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
import { ApiError } from "@/lib/apiClient";

import { useUnirseQuiniela } from "../hooks/useQuinielas";
import { type UnirseQuinielaForm, unirseQuinielaSchema } from "../schemas/quiniela.schema";

export function UnirseQuinielaDialog() {
  const [open, setOpen] = useState(false);
  const unirseMutation = useUnirseQuiniela();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UnirseQuinielaForm>({ resolver: zodResolver(unirseQuinielaSchema) });

  const onSubmit = handleSubmit(async (datos) => {
    try {
      const quiniela = await unirseMutation.mutateAsync(datos);
      toast.success(`Te uniste a "${quiniela.nombre}"`);
      reset();
      setOpen(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        toast.error("Código de invitación inválido");
      } else if (error instanceof ApiError && error.status === 409) {
        toast.error("Ya participas en esa quiniela");
      } else {
        toast.error("No se pudo unir a la quiniela");
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Unirse con código</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unirse a una quiniela</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="codigo">Código de invitación</Label>
            <Input id="codigo" placeholder="MUND-XXXX" {...register("codigo")} />
            {errors.codigo && (
              <p role="alert" className="text-sm text-destructive">
                {errors.codigo.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Uniendo..." : "Unirme"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
