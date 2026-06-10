import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/apiClient";

import { useLogin, useRegister } from "../hooks/useAuth";
import { type RegisterForm, registerSchema } from "../schemas/auth.schema";

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const loginMutation = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (datos) => {
    try {
      await registerMutation.mutateAsync(datos);
      await loginMutation.mutateAsync({ email: datos.email, password: datos.password });
      toast.success("¡Cuenta creada! Bienvenido");
      void navigate("/");
    } catch {
      // el error queda en registerMutation.error
    }
  });

  const errorMessage =
    registerMutation.error instanceof ApiError && registerMutation.error.status === 409
      ? "Ese email ya está registrado"
      : registerMutation.error !== null
        ? "No se pudo crear la cuenta"
        : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Crear cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" autoComplete="name" {...register("nombre")} />
              {errors.nombre && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.nombre.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {errorMessage && (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-medium text-foreground underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
