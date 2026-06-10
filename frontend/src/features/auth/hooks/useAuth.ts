import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/authStore";

import { fetchMe, login, register } from "../api/auth.api";

export const authKeys = {
  me: ["me"] as const,
};

export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    enabled: accessToken !== null,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (token) => {
      setAccessToken(token.access_token);
      void queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}

export function useLogout() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const queryClient = useQueryClient();
  return () => {
    setAccessToken(null);
    queryClient.clear();
  };
}
