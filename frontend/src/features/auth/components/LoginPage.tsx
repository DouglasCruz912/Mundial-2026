import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/apiClient";

import { useLogin } from "../hooks/useAuth";
import { type LoginForm, loginSchema } from "../schemas/auth.schema";

export default function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (datos) => {
    try {
      await loginMutation.mutateAsync(datos);
      void navigate("/");
    } catch {
      // el error queda en loginMutation.error
    }
  });

  const errorMessage =
    loginMutation.error instanceof ApiError
      ? "Email o contraseña incorrectos"
      : loginMutation.error !== null
        ? "Error de conexión"
        : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">⚽ Mundial 2026</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Inicia sesión para jugar tus quinielas
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
                autoComplete="current-password"
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
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="font-medium text-foreground underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
