import type { BootstrapData } from "@/lib/edu-types";

export async function eduRequest<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch("/api/edu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const result = await response.json() as { ok: boolean; data?: T; error?: string };
  if (!response.ok || !result.ok) throw new Error(result.error || "Не удалось связаться с сервисом");
  return result.data as T;
}

export type SessionBootstrap = BootstrapData | null;
