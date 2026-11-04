import { timingSafeEqual } from "./core.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

/** Roda depois de responder (a Meta e o Mercado Pago exigem resposta rápida). */
export function emSegundoPlano(p: Promise<unknown>) {
  const tarefa = p.catch((e) => console.error("Erro em segundo plano:", e));
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(tarefa);
}

export function json(body: unknown, status = 200, extra: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

/** Confere um segredo enviado em header (comparação em tempo constante). */
export function segredoOk(recebido: string | null, esperado: string | undefined): boolean {
  return !!esperado && !!recebido && timingSafeEqual(recebido, esperado);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
