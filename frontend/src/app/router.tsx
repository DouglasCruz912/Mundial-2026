import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";

import { Layout } from "./Layout";
import { AdminRoute, ProtectedRoute } from "./ProtectedRoute";

const LoginPage = lazy(() => import("@/features/auth/components/LoginPage"));
const RegisterPage = lazy(() => import("@/features/auth/components/RegisterPage"));
const DashboardPage = lazy(() => import("@/features/quinielas/components/DashboardPage"));
const QuinielaDetailPage = lazy(
  () => import("@/features/quinielas/components/QuinielaDetailPage"),
);
const AdminResultadosPage = lazy(
  () => import("@/features/admin/components/AdminResultadosPage"),
);

function withSuspense(children: React.ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Cargando...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const router = createBrowserRouter([
  { path: "/login", element: withSuspense(<LoginPage />) },
  { path: "/register", element: withSuspense(<RegisterPage />) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: withSuspense(<DashboardPage />) },
          { path: "/quinielas/:id", element: withSuspense(<QuinielaDetailPage />) },
          {
            element: <AdminRoute />,
            children: [
              { path: "/admin/resultados", element: withSuspense(<AdminResultadosPage />) },
            ],
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
