import { env } from "./db.ts";

/** API oficial do WhatsApp (Cloud API da Meta). */
function graphUrl(): string {
  const versao = Deno.env.get("WHATSAPP_GRAPH_VERSION") ?? "v23.0";
  return `https://graph.facebook.com/${versao}/${env("WHATSAPP_PHONE_NUMBER_ID")}/messages`;
}

export class WhatsAppError extends Error {
  constructor(public codigo: number, mensagem: string) {
    super(mensagem);
  }
}

// deno-lint-ignore no-explicit-any
async function enviar(payload: any): Promise<string> {
  const res = await fetch(graphUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("WHATSAPP_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new WhatsAppError(json?.error?.code ?? res.status, json?.error?.message ?? `HTTP ${res.status}`);
  }
  return json?.messages?.[0]?.id ?? "";
}

/** Mensagem iniciada pela empresa: só com modelo aprovado pela Meta. */
export function enviarModelo(para: string, parametrosCorpo: string[]): Promise<string> {
  return enviar({
    to: para,
    type: "template",
    template: {
      name: env("WHATSAPP_TEMPLATE"),
      language: { code: Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "pt_BR" },
      components: [{
        type: "body",
        parameters: parametrosCorpo.map((t) => ({ type: "text", text: t })),
      }],
    },
  });
}

/** Texto livre: só funciona até 24 h depois da última mensagem do cliente. */
export function enviarTexto(para: string, texto: string): Promise<string> {
  return enviar({ to: para, type: "text", text: { body: texto, preview_url: true } });
}

/** Códigos de erro da Cloud API que tratamos de forma especial. */
export const ERRO = {
  NAO_E_WHATSAPP: 131026, // mensagem não entregável (número sem WhatsApp, etc.)
  PAROU_MARKETING: 131050, // o usuário parou de receber mensagens de marketing da empresa
  ECOSSISTEMA: 131049, // Meta segurou a entrega para proteger o ecossistema
  LIMITE_TAXA: 130429,
  SPAM_LIMITE: 131048,
} as const;
