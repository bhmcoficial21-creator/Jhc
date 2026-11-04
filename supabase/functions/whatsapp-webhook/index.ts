/**
 * Recebe as mensagens do WhatsApp (webhook da Cloud API da Meta).
 * - verifica a assinatura X-Hub-Signature-256;
 * - quem pede para sair vira "nao_contatar" na hora (sem passar pela IA);
 * - as demais mensagens são respondidas pelo robô, a não ser que um humano tenha assumido;
 * - alertas de qualidade do número pausam os disparos automaticamente.
 */
import { advanceStatus, isOptOut, parseWhatsAppWebhook, phoneVariants, qualidadeExigePausa, type Status, verifyMetaSignature } from "../_shared/core.ts";
import { db, env, getConfig, type Lead, marcarNaoContatar, registrarEvento, salvarMensagem, setConfig } from "../_shared/db.ts";
import { enviarTexto, ERRO } from "../_shared/whatsapp.ts";
import { responder } from "../_shared/agent.ts";
import { emSegundoPlano, sleep } from "../_shared/http.ts";

const DESPEDIDA = "Tudo bem, não vou mais te enviar mensagens. Desculpe o incômodo e bom trabalho!";

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const ok = url.searchParams.get("hub.mode") === "subscribe" &&
      url.searchParams.get("hub.verify_token") === env("WHATSAPP_VERIFY_TOKEN");
    return ok ? new Response(url.searchParams.get("hub.challenge") ?? "") : new Response("proibido", { status: 403 });
  }
  if (req.method !== "POST") return new Response("método não permitido", { status: 405 });

  const raw = await req.text();
  if (!(await verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), env("WHATSAPP_APP_SECRET")))) {
    return new Response("assinatura inválida", { status: 401 });
  }

  emSegundoPlano(processar(JSON.parse(raw)));
  return new Response("ok");
});

// deno-lint-ignore no-explicit-any
async function processar(body: any) {
  const { mensagens, status, qualidade } = parseWhatsAppWebhook(body);

  for (const q of qualidade) {
    await registrarEvento("qualidade", q);
    if (qualidadeExigePausa(q)) {
      await setConfig("robo_ativo", false);
      await registrarEvento("pausa_automatica", `Qualidade do número: ${q}`);
    }
  }

  for (const s of status) await tratarStatus(s);
  for (const m of mensagens) await tratarMensagem(m.id, m.from, m.texto);
}

async function tratarStatus(s: ReturnType<typeof parseWhatsAppWebhook>["status"][number]) {
  await db.from("mensagens").update({
    entrega: s.status,
    erro: s.erroCodigo ? `${s.erroCodigo} ${s.erroTitulo ?? ""}` : null,
  }).eq("wa_message_id", s.id);
  if (s.status !== "failed" || !s.erroCodigo) return;

  const { data: msg } = await db.from("mensagens").select("place_id").eq("wa_message_id", s.id).maybeSingle();
  if (!msg) return;
  if (s.erroCodigo === ERRO.NAO_E_WHATSAPP) {
    await db.from("leads").update({ provavel_whatsapp: false, status: "novo" }).eq("place_id", msg.place_id);
  } else if (s.erroCodigo === ERRO.PAROU_MARKETING) {
    await marcarNaoContatar(msg.place_id, "parou de receber mensagens de marketing");
    await registrarEvento("bloqueio", msg.place_id);
  } else if (s.erroCodigo === ERRO.ECOSSISTEMA || s.erroCodigo === ERRO.SPAM_LIMITE) {
    await registrarEvento("bloqueio", `${msg.place_id}: ${s.erroCodigo}`);
  }
}

async function acharOuCriarLead(from: string): Promise<Lead> {
  const { data } = await db.from("leads").select("*").in("whatsapp", phoneVariants(from))
    .order("primeira_msg_em", { ascending: false, nullsFirst: false }).limit(1);
  if (data?.length) return data[0] as Lead;
  // Alguém que chamou sem ter sido prospectado (ex.: viu a plaquinha de outro comércio).
  const novo = {
    place_id: `wa:${from}`,
    nome: `Contato ${from.slice(-4)}`,
    whatsapp: from,
    provavel_whatsapp: true,
    status: "respondeu",
  };
  const { data: criado, error } = await db.from("leads").upsert(novo).select("*").single();
  if (error) throw error;
  return criado as Lead;
}

async function tratarMensagem(waId: string, from: string, texto: string) {
  const lead = await acharOuCriarLead(from);
  const nova = await salvarMensagem({
    place_id: lead.place_id, direcao: "entrada", autor: "cliente", texto, wa_message_id: waId,
  });
  if (!nova) return; // webhook repetido

  const agora = new Date().toISOString();
  await db.from("leads").update({ ultima_msg_cliente: agora, data_ultimo_contato: agora }).eq("place_id", lead.place_id);

  if (lead.status === "nao_contatar") return;

  if (isOptOut(texto)) {
    await marcarNaoContatar(lead.place_id, `mensagem: ${texto.slice(0, 80)}`);
    await responderCliente(lead, DESPEDIDA, "sistema");
    return;
  }

  const status = advanceStatus(lead.status as Status, "respondeu");
  if (status !== lead.status) {
    await db.from("leads").update({ status }).eq("place_id", lead.place_id);
    lead.status = status;
  }
  if (lead.robo_pausado) return;

  // Espera o cliente terminar de digitar: se chegou outra mensagem depois, ela é que responde.
  await sleep(5000);
  const { data: ultima } = await db.from("mensagens").select("wa_message_id").eq("place_id", lead.place_id)
    .eq("direcao", "entrada").order("criado_em", { ascending: false }).limit(1).single();
  if (ultima?.wa_message_id !== waId) return;

  const { data: atualizado } = await db.from("leads").select("*").eq("place_id", lead.place_id).single();
  if (!atualizado || atualizado.robo_pausado || atualizado.status === "nao_contatar") return;

  const { data: historico } = await db.from("mensagens").select("direcao, texto, criado_em")
    .eq("place_id", lead.place_id).order("criado_em", { ascending: false }).limit(40);

  const r = await responder(atualizado as Lead, await getConfig(), (historico ?? []).reverse());
  if (r.resposta) await responderCliente(atualizado as Lead, r.resposta, "robo");
}

async function responderCliente(lead: Lead, texto: string, autor: "robo" | "sistema") {
  if (!lead.whatsapp) return;
  let id: string | null = null;
  try {
    id = await enviarTexto(lead.whatsapp, texto);
  } catch (e) {
    await registrarEvento("erro_envio", `${lead.place_id}: ${(e as Error).message}`);
  }
  await salvarMensagem({ place_id: lead.place_id, direcao: "saida", autor, texto, wa_message_id: id || null });
}
