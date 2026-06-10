import { create } from "zustand";

// Solo estado de CLIENTE: el access token vive en memoria (no se persiste,
// la sesión se rehidrata vía cookie httpOnly + /token/refresh).
// El usuario `me` es estado de servidor → TanStack Query.
type AuthState = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
}));
