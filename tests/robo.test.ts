import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  advanceStatus, buildDashboard, filterPlaces, isOptOut, normalizePhoneBR, parseWhatsAppWebhook,
  phoneVariants, placeToLead, podeDisparar, qualidadeExigePausa, verifyMercadoPagoSignature, verifyMetaSignature,
} from "../supabase/functions/_shared/core.ts";

test("isOptOut reconhece pedidos para sair", () => {
  for (const t of ["SAIR", "Pare", "não quero", "Nao tenho interesse, obrigado", "para de me mandar mensagem",
    "me tira da lista", "sem interesse", "isso é spam", "Não me mande mais nada", "descadastrar"]) {
    assert.equal(isOptOut(t), true, t);
  }
  for (const t of ["Quero saber mais", "quanto custa?", "não entendi, como funciona?", "agora não posso, me chama amanhã",
    "pode parar aqui na loja amanhã?", "", "Olá"]) {
    assert.equal(isOptOut(t), false, t);
  }
});

test("advanceStatus nunca rebaixa e nao_contatar sempre vence", () => {
  assert.equal(advanceStatus("contatado", "respondeu"), "respondeu");
  assert.equal(advanceStatus("interessado", "respondeu"), "interessado");
  assert.equal(advanceStatus("vendido", "interessado"), "vendido");
  assert.equal(advanceStatus("vendido", "nao_contatar"), "nao_contatar");
  assert.equal(advanceStatus("nao_contatar", "respondeu"), "nao_contatar");
});

test("phoneVariants cobre o 9º dígito", () => {
  assert.deepEqual(phoneVariants("5511912345678").sort(), ["551112345678", "5511912345678"].sort());
  assert.deepEqual(phoneVariants("551192345678").sort(), ["551192345678", "5511992345678"].sort());
  assert.equal(normalizePhoneBR("(11) 91234-5678")?.full, "5511912345678");
});

test("placeToLead e filterPlaces", () => {
  const seen = new Set<string>();
  const ps = filterPlaces([{ id: "A", userRatingCount: 3 }, { id: "B", userRatingCount: 80 }, { id: "A" }], 50, seen);
  assert.deepEqual(ps.map((p) => p.id), ["A"]);
  const l = placeToLead({ id: "A", displayName: { text: "Salão X" }, nationalPhoneNumber: "(11) 91234-5678" }, "Jaguaré", "salão");
  assert.equal(l.whatsapp, "5511912345678");
  assert.equal(l.provavel_whatsapp, true);
  assert.equal(placeToLead({ id: "B", nationalPhoneNumber: "(11) 3711-0000" }, "x", "y").provavel_whatsapp, false);
});

const cfg = { robo_ativo: true, limite_diario: 15, hora_inicio: 9, hora_fim: 18, dias_semana: [1, 2, 3, 4, 5, 6] };
const quarta14h = new Date("2026-11-04T17:00:00Z"); // 14h em São Paulo, quarta-feira
const zero = { enviados_hoje: 0, enviados_7d: 0, optouts_7d: 0, bloqueios_7d: 0 };

test("podeDisparar: horário, dias, limite e travas", () => {
  assert.deepEqual(podeDisparar(cfg, zero, quarta14h, 3), { ok: true, quantidade: 3 });
  assert.deepEqual(podeDisparar(cfg, { ...zero, enviados_hoje: 14 }, quarta14h, 3), { ok: true, quantidade: 1 });
  assert.equal(podeDisparar(cfg, { ...zero, enviados_hoje: 15 }, quarta14h, 3).ok, false);
  assert.equal(podeDisparar({ ...cfg, robo_ativo: false }, zero, quarta14h, 3).ok, false);
  assert.equal(podeDisparar(cfg, zero, new Date("2026-11-04T22:00:00Z"), 3).ok, false); // 19h SP
  assert.equal(podeDisparar(cfg, zero, new Date("2026-11-04T11:30:00Z"), 3).ok, false); // 8h30 SP
  assert.equal(podeDisparar(cfg, zero, new Date("2026-11-08T15:00:00Z"), 3).ok, false); // domingo
  const trava = podeDisparar(cfg, { ...zero, enviados_7d: 20, optouts_7d: 2 }, quarta14h, 3);
  assert.deepEqual(trava, { ok: false, motivo: "trava: muitos pedidos para sair" });
  assert.equal(podeDisparar(cfg, { ...zero, enviados_7d: 5, optouts_7d: 2 }, quarta14h, 3).ok, true); // amostra pequena
  assert.equal(podeDisparar(cfg, { ...zero, bloqueios_7d: 2 }, quarta14h, 3).ok, false);
});

test("parseWhatsAppWebhook: texto, botão, status e qualidade", () => {
  const body = {
    entry: [{
      changes: [
        {
          field: "messages",
          value: {
            messages: [
              { id: "m1", from: "5511912345678", timestamp: "1", type: "text", text: { body: "Quanto custa?" } },
              { id: "m2", from: "5511912345678", timestamp: "2", type: "button", button: { text: "Não tenho interesse", payload: "x" } },
              { id: "m3", from: "5511912345678", timestamp: "3", type: "image", image: {} },
            ],
            statuses: [{ id: "s1", status: "failed", recipient_id: "551100", errors: [{ code: 131026, title: "Undeliverable" }] }],
          },
        },
        { field: "phone_number_quality_update", value: { event: "FLAGGED", current_limit: "TIER_250" } },
      ],
    }],
  };
  const r = parseWhatsAppWebhook(body);
  assert.deepEqual(r.mensagens.map((m) => m.texto), ["Quanto custa?", "Não tenho interesse", "[image]"]);
  assert.equal(isOptOut(r.mensagens[1].texto), true);
  assert.deepEqual(r.status[0], { id: "s1", status: "failed", recipient: "551100", erroCodigo: 131026, erroTitulo: "Undeliverable" });
  assert.deepEqual(r.qualidade, ["FLAGGED"]);
  assert.equal(qualidadeExigePausa("FLAGGED"), true);
  assert.equal(qualidadeExigePausa("UPGRADE"), false);
  assert.deepEqual(parseWhatsAppWebhook({}), { mensagens: [], status: [], qualidade: [] });
});

test("assinaturas da Meta e do Mercado Pago", async () => {
  const corpo = '{"a":1}';
  const sig = "sha256=" + createHmac("sha256", "segredo").update(corpo).digest("hex");
  assert.equal(await verifyMetaSignature(corpo, sig, "segredo"), true);
  assert.equal(await verifyMetaSignature(corpo + " ", sig, "segredo"), false);
  assert.equal(await verifyMetaSignature(corpo, null, "segredo"), false);

  const manifesto = "id:123456;request-id:req-1;ts:1700000000;";
  const v1 = createHmac("sha256", "mp").update(manifesto).digest("hex");
  assert.equal(await verifyMercadoPagoSignature(`ts=1700000000,v1=${v1}`, "req-1", "123456", "mp"), true);
  assert.equal(await verifyMercadoPagoSignature(`ts=1700000000,v1=${v1}`, "req-2", "123456", "mp"), false);
  assert.equal(await verifyMercadoPagoSignature(null, "req-1", "123456", "mp"), false);
});

test("buildDashboard no fuso de São Paulo", () => {
  const now = new Date("2026-11-04T23:30:00Z"); // 20h30 SP do dia 04/11
  const r = buildDashboard([
    { status: "novo", encontrado_em: "2026-11-05T01:00:00Z", data_venda: null },     // 22h SP de 04/11
    { status: "vendido", encontrado_em: "2026-10-20T12:00:00Z", data_venda: "2026-11-01T15:00:00Z" },
    { status: "contatado", encontrado_em: "2026-10-26T12:00:00Z", data_venda: null }, // período anterior
  ], 1, 7, now);
  assert.equal(r.fim, "04/11");
  assert.equal(r.buckets[6].chegaram, 1);
  assert.equal(r.convertidos, 1);
  assert.equal(r.variacaoChegaram, 0);
  assert.equal(r.funil.nao_contatar, 1);
  assert.equal(r.total, 4);
});
