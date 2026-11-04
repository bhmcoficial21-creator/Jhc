/**
 * Confirmação de pagamento (webhook do Mercado Pago).
 * Quando o pagamento é aprovado, o lead vira "vendido" sozinho: data da venda,
 * avaliações no momento da venda e link de avaliação para gravar na plaquinha.
 */
import { verifyMercadoPagoSignature } from "../_shared/core.ts";
import { db, env, marcarVendido, registrarEvento, salvarMensagem } from "../_shared/db.ts";
import { buscarPagamento } from "../_shared/mercadopago.ts";
import { enviarTexto } from "../_shared/whatsapp.ts";
import { emSegundoPlano } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("método não permitido", { status: 405 });
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const tipo = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? body?.type;
  const dataId = url.searchParams.get("data.id") ?? String(body?.data?.id ?? "");
  if (tipo !== "payment" || !dataId) return new Response("ignorado");

  const ok = await verifyMercadoPagoSignature(
    req.headers.get("x-signature"),
    req.headers.get("x-request-id"),
    dataId,
    env("MP_WEBHOOK_SECRET"),
  );
  if (!ok) return new Response("assinatura inválida", { status: 401 });

  emSegundoPlano(processar(dataId));
  return new Response("ok");
});

async function processar(pagamentoId: string) {
  const pg = await buscarPagamento(pagamentoId);
  if (pg.status !== "approved" || !pg.external_reference) return;

  const placeId = pg.external_reference;
  if (!(await marcarVendido(placeId, pagamentoId))) return; // já estava vendido
  await registrarEvento("venda", `${placeId}: pagamento ${pagamentoId}`);

  const { data: lead } = await db.from("leads").select("whatsapp").eq("place_id", placeId).single();
  if (!lead?.whatsapp) return;
  const texto = "Pagamento confirmado, muito obrigado! O vendedor vai combinar a entrega da sua plaquinha com você por aqui.";
  try {
    const id = await enviarTexto(lead.whatsapp, texto);
    await salvarMensagem({ place_id: placeId, direcao: "saida", autor: "sistema", texto, wa_message_id: id || null });
  } catch (e) {
    // Fora da janela de 24 h o texto livre não é aceito; a venda já está registrada.
    await registrarEvento("erro_envio", `${placeId}: ${(e as Error).message}`);
  }
}
