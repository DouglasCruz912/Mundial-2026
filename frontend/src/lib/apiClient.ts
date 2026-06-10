import type { z } from "zod";

import { useAuthStore } from "@/stores/authStore";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Body como application/x-www-form-urlencoded (login OAuth2) */
  form?: Record<string, string>;
};

async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (options.form !== undefined) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(options.form).toString();
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  if (accessToken !== null) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
    credentials: "include", // cookie httpOnly del refresh token
  });
}

async function tryRefresh(): Promise<boolean> {
  const resp = await fetch(`${BASE_URL}/api/v1/token/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!resp.ok) return false;
  const data = (await resp.json()) as { access_token: string };
  useAuthStore.getState().setAccessToken(data.access_token);
  return true;
}

/**
 * Petición tipada: toda respuesta se valida con el schema Zod de la feature.
 * Ante 401 intenta UN refresh y reintenta una vez.
 */
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  let resp = await rawRequest(path, options);

  if (resp.status === 401 && (await tryRefresh())) {
    resp = await rawRequest(path, options);
  }

  if (!resp.ok) {
    let detail = "Error de conexión";
    try {
      const data = (await resp.json()) as { detail?: string };
      if (typeof data.detail === "string") detail = data.detail;
    } catch {
      // respuesta sin cuerpo JSON
    }
    if (resp.status === 401) {
      useAuthStore.getState().setAccessToken(null);
    }
    throw new ApiError(resp.status, detail);
  }

  if (resp.status === 204) {
    return schema.parse(undefined);
  }
  return schema.parse(await resp.json());
}

export { tryRefresh };
