import { Link, Outlet, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { useLogout, useMe } from "@/features/auth/hooks/useAuth";

export function Layout() {
  const { data: me } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate("/login");
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <nav className="mx-auto flex max-w-4xl items-center justify-between p-4">
          <Link to="/" className="text-lg font-bold">
            ⚽ Mundial 2026
          </Link>
          <div className="flex items-center gap-3">
            {me?.rol === "admin" && (
              <Link to="/admin/resultados" className="text-sm font-medium underline">
                Resultados (admin)
              </Link>
            )}
            <span className="text-sm text-muted-foreground">{me?.nombre}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Salir
            </Button>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
