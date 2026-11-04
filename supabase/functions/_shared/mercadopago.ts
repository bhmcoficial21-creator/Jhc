import { env } from "./db.ts";

const API = "https://api.mercadopago.com";

function headers() {
  return {
    Authorization: `Bearer ${env("MP_ACCESS_TOKEN")}`,
    "Content-Type": "application/json",
  };
}

/** Cria um link de pagamento (Checkout Pro: Pix, cartão e boleto). */
export async function criarLinkPagamento(p: {
  titulo: string;
  quantidade: number;
  precoUnitario: number;
  referencia: string; // place_id do lead
}): Promise<string> {
  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      items: [{
        title: p.titulo,
        quantity: p.quantidade,
        unit_price: p.precoUnitario,
        currency_id: "BRL",
      }],
      external_reference: p.referencia,
      notification_url: `${env("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${json?.message ?? "erro"}`);
  return json.init_point as string;
}

/** Consulta o pagamento direto na API (nunca confiamos só no corpo do webhook). */
export async function buscarPagamento(id: string): Promise<{
  status: string;
  external_reference: string | null;
}> {
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, { headers: headers() });
  const json = await res.json();
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${json?.message ?? "erro"}`);
  return { status: json.status, external_reference: json.external_reference ?? null };
}
