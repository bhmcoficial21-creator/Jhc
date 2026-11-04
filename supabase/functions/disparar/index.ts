/**
 * Disparo automático da primeira mensagem (modelo aprovado pela Meta), chamado pelo pg_cron.
 * Respeita: robô ligado, dias/horário comercial, limite diário, lote por rodada e a trava
 * automática (muitos pedidos para sair ou bloqueios nos últimos 7 dias).
 */
import { horaSaoPaulo, podeDisparar } from "../_shared/core.ts";
import { db, getConfig, registrarEvento, salvarMensagem, setConfig } from "../_shared/db.ts";
import { enviarModelo, ERRO, WhatsAppError } from "../_shared/whatsapp.ts";
import { json, segredoOk, sleep } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (!segredoOk(req.headers.get("x-cron-secret"), Deno.env.get("CRON_SECRET"))) {
    return json({ erro: "não autorizado" }, 401);
  }
  return json(await disparar());
});

async function contar(q: PromiseLike<{ count: number | null }>) {
  return (await q).count ?? 0;
}

export async function disparar() {
  const cfg = await getConfig();
  const agora = new Date();
  const seteDias = new Date(agora.getTime() - 7 * 86400000).toISOString();
  const inicioHoje = new Date(`${horaSaoPaulo(agora).dataISO}T03:00:00Z`).toISOString(); // 00:00 em SP

  const estado = {
    enviados_hoje: await contar(db.from("leads").select("*", { count: "exact", head: true }).gte("primeira_msg_em", inicioHoje)),
    enviados_7d: await contar(db.from("leads").select("*", { count: "exact", head: true }).gte("primeira_msg_em", seteDias)),
    optouts_7d: await contar(db.from("leads").select("*", { count: "exact", head: true }).gte("optout_em", seteDias).not("primeira_msg_em", "is", null)),
    bloqueios_7d: await contar(db.from("eventos").select("*", { count: "exact", head: true }).eq("tipo", "bloqueio").gte("criado_em", seteDias)),
  };

  const decisao = podeDisparar({
    robo_ativo: cfg.robo_ativo === true,
    limite_diario: Number(cfg.limite_diario ?? 15),
    hora_inicio: Number(cfg.hora_inicio ?? 9),
    hora_fim: Number(cfg.hora_fim ?? 18),
    dias_semana: cfg.dias_semana ?? [1, 2, 3, 4, 5, 6],
  }, estado, agora, Number(cfg.lote_por_rodada ?? 3));

  if (!decisao.ok) {
    if (decisao.motivo.startsWith("trava") && cfg.robo_ativo === true) {
      await setConfig("robo_ativo", false);
      await registrarEvento("pausa_automatica", decisao.motivo);
    }
    return { enviados: 0, motivo: decisao.motivo, estado };
  }

  const { data: fila } = await db.from("leads").select("place_id, nome, whatsapp")
    .eq("status", "novo").eq("provavel_whatsapp", true).not("whatsapp", "is", null)
    .is("primeira_msg_em", null).order("encontrado_em", { ascending: true }).limit(decisao.quantidade * 3);

  let enviados = 0;
  for (const lead of fila ?? []) {
    if (enviados >= decisao.quantidade) break;

    // O mesmo número pode estar em dois cadastros do Google: nunca manda duas vezes.
    const { count } = await db.from("leads").select("*", { count: "exact", head: true })
      .eq("whatsapp", lead.whatsapp).or("primeira_msg_em.not.is.null,status.eq.nao_contatar");
    if (count) {
      await db.from("leads").update({ provavel_whatsapp: false, observacoes: "Número já contatado em outro cadastro." })
        .eq("place_id", lead.place_id);
      continue;
    }

    try {
      const id = await enviarModelo(lead.whatsapp, [lead.nome || "tudo bem"]);
      const quando = new Date().toISOString();
      await db.from("leads").update({ status: "contatado", primeira_msg_em: quando, data_ultimo_contato: quando })
        .eq("place_id", lead.place_id);
      const preview = (Deno.env.get("WHATSAPP_TEMPLATE_PREVIEW") ?? "[modelo {nome}]").replaceAll("{nome}", lead.nome);
      await salvarMensagem({ place_id: lead.place_id, direcao: "saida", autor: "robo", texto: preview, wa_message_id: id || null });
      enviados++;
    } catch (e) {
      const codigo = e instanceof WhatsAppError ? e.codigo : 0;
      await registrarEvento("erro_disparo", `${lead.place_id}: ${codigo} ${(e as Error).message}`);
      if (codigo === ERRO.NAO_E_WHATSAPP) {
        await db.from("leads").update({ provavel_whatsapp: false }).eq("place_id", lead.place_id);
        continue;
      }
      if (codigo === ERRO.ECOSSISTEMA || codigo === ERRO.SPAM_LIMITE) {
        await registrarEvento("bloqueio", `${lead.place_id}: ${codigo}`);
      }
      break; // limite de taxa, token inválido etc.: tenta de novo na próxima rodada
    }
    await sleep(3000 + Math.random() * 4000);
  }
  return { enviados, estado };
}
