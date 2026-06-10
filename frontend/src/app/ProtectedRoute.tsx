import { Navigate, Outlet } from "react-router";

import { useMe } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken === null) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function AdminRoute() {
  const { data: me, isLoading } = useMe();
  if (isLoading) return null;
  if (me === undefined || me.rol !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
