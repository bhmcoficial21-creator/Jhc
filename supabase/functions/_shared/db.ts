import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { buildReviewUrl } from "./core.ts";

export function env(nome: string): string {
  const v = Deno.env.get(nome);
  if (!v) throw new Error(`Variável de ambiente ausente: ${nome}`);
  return v;
}

export const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

export interface Lead {
  place_id: string;
  nome: string;
  bairro_busca: string | null;
  categoria: string | null;
  avaliacoes: number;
  whatsapp: string | null;
  status: string;
  robo_pausado: boolean;
  observacoes: string | null;
  ultima_msg_cliente: string | null;
  pagamento_link: string | null;
  data_venda: string | null;
}

// deno-lint-ignore no-explicit-any
export type Config = Record<string, any>;

export async function getConfig(): Promise<Config> {
  const { data, error } = await db.from("config").select("chave, valor");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.chave, r.valor]));
}

export async function setConfig(chave: string, valor: unknown) {
  const { error } = await db.from("config").upsert({ chave, valor });
  if (error) throw error;
}

export async function registrarEvento(tipo: string, detalhe: string) {
  await db.from("eventos").insert({ tipo, detalhe });
}

export async function salvarMensagem(m: {
  place_id: string;
  direcao: "entrada" | "saida";
  autor: "cliente" | "robo" | "humano" | "sistema";
  texto: string;
  wa_message_id?: string | null;
}): Promise<boolean> {
  // ignoreDuplicates: a Meta reenvia webhooks; a mesma mensagem não é processada duas vezes.
  const { data, error } = await db
    .from("mensagens")
    .upsert(m, { onConflict: "wa_message_id", ignoreDuplicates: true })
    .select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

export async function marcarNaoContatar(placeId: string, motivo: string) {
  await db.from("leads").update({
    status: "nao_contatar",
    optout_em: new Date().toISOString(),
    robo_pausado: true,
  }).eq("place_id", placeId);
  await registrarEvento("optout", `${placeId}: ${motivo}`);
}

/** Marca a venda (idempotente): data, avaliações no momento da venda e link de avaliação. */
export async function marcarVendido(placeId: string, pagamentoId: string | null): Promise<boolean> {
  const { data: lead } = await db.from("leads").select("status, avaliacoes").eq("place_id", placeId)
    .maybeSingle();
  if (!lead || lead.status === "vendido") return false;
  const { error } = await db.from("leads").update({
    status: "vendido",
    data_venda: new Date().toISOString(),
    pagamento_id: pagamentoId,
    avaliacoes_na_venda: lead.avaliacoes,
    link_avaliacao: placeId.startsWith("wa:") ? null : buildReviewUrl(placeId),
  }).eq("place_id", placeId);
  if (error) throw error;
  return true;
}
