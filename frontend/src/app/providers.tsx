import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { tryRefresh } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";

/** Rehidrata la sesión vía cookie httpOnly antes del primer render con datos. */
function SessionLoader({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  // Sincronización con sistema externo (cookie del backend): caso válido de efecto
  useEffect(() => {
    void tryRefresh().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    );
  }
  return children;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionLoader>{children}</SessionLoader>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
