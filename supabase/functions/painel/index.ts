/**
 * API do painel web. Autenticação: header "Authorization: Bearer <PAINEL_TOKEN>".
 * GET  ?dias=7            -> números do painel, leads recentes, estado do robô
 * GET  ?conversa=<id>     -> mensagens de um lead
 * POST {acao, ...}        -> status | robo | pausar_lead | enviar | buscar
 */
import { buildDashboard, STATUS_LIST } from "../_shared/core.ts";
import { db, getConfig, marcarVendido, salvarMensagem, setConfig } from "../_shared/db.ts";
import { buscarLeads } from "../_shared/busca.ts";
import { enviarTexto } from "../_shared/whatsapp.ts";
import { json, segredoOk } from "../_shared/http.ts";

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("PAINEL_ORIGEM") ?? "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!segredoOk(token, Deno.env.get("PAINEL_TOKEN"))) return json({ erro: "Token inválido." }, 401, CORS);

  try {
    if (req.method === "GET") return json(await ler(new URL(req.url)), 200, CORS);
    if (req.method === "POST") return json(await agir(await req.json()), 200, CORS);
    return json({ erro: "método não permitido" }, 405, CORS);
  } catch (e) {
    return json({ erro: (e as Error).message }, 500, CORS);
  }
});

async function ler(url: URL) {
  const conversa = url.searchParams.get("conversa");
  if (conversa) {
    const { data } = await db.from("mensagens").select("direcao, autor, texto, entrega, criado_em")
      .eq("place_id", conversa).order("criado_em", { ascending: true }).limit(200);
    return { mensagens: data ?? [] };
  }

  const dias = Number(url.searchParams.get("dias")) || 7;
  const { data: todos } = await db.from("leads").select("status, encontrado_em, data_venda");
  const leads = todos ?? [];
  const painel = buildDashboard(
    leads,
    leads.filter((l) => l.status === "nao_contatar").length,
    dias,
    new Date(),
  );

  const { data: recentes } = await db.from("leads")
    .select("place_id, nome, categoria, bairro_busca, avaliacoes, status, robo_pausado, encontrado_em, data_ultimo_contato, ultima_msg_cliente, provavel_whatsapp, link_avaliacao")
    .neq("status", "nao_contatar")
    .order("data_ultimo_contato", { ascending: false, nullsFirst: false })
    .order("encontrado_em", { ascending: false })
    .limit(60);

  const cfg = await getConfig();
  const { data: eventos } = await db.from("eventos").select("tipo, detalhe, criado_em")
    .in("tipo", ["pausa_automatica", "qualidade", "bloqueio", "humano", "venda"])
    .order("criado_em", { ascending: false }).limit(8);

  return {
    ...painel,
    leads: recentes ?? [],
    robo: { ativo: cfg.robo_ativo === true, limite_diario: cfg.limite_diario },
    eventos: eventos ?? [],
  };
}

// deno-lint-ignore no-explicit-any
async function agir(b: any) {
  switch (b?.acao) {
    case "status": {
      if (!STATUS_LIST.includes(b.status)) throw new Error("Status inválido.");
      if (b.status === "vendido") {
        await marcarVendido(b.place_id, null);
      } else {
        const extra = b.status === "nao_contatar" ? { optout_em: new Date().toISOString(), robo_pausado: true } : {};
        await db.from("leads").update({ status: b.status, data_venda: null, link_avaliacao: null, ...extra })
          .eq("place_id", b.place_id);
      }
      return { ok: true };
    }
    case "robo":
      await setConfig("robo_ativo", b.ativo === true);
      return { ok: true };
    case "pausar_lead":
      await db.from("leads").update({ robo_pausado: b.pausado === true }).eq("place_id", b.place_id);
      return { ok: true };
    case "enviar": {
      // Resposta do vendedor (humano). Só funciona até 24 h após a última mensagem do cliente.
      const { data: lead } = await db.from("leads").select("whatsapp").eq("place_id", b.place_id).single();
      if (!lead?.whatsapp) throw new Error("Lead sem WhatsApp.");
      const texto = String(b.texto ?? "").trim();
      if (!texto) throw new Error("Mensagem vazia.");
      const id = await enviarTexto(lead.whatsapp, texto);
      await salvarMensagem({ place_id: b.place_id, direcao: "saida", autor: "humano", texto, wa_message_id: id || null });
      await db.from("leads").update({ robo_pausado: true }).eq("place_id", b.place_id);
      return { ok: true };
    }
    case "buscar":
      return await buscarLeads();
    default:
      throw new Error("Ação desconhecida.");
  }
}
