/**
 * Lógica pura do robô (sem rede, sem banco). Roda no Deno (Edge Functions) e no Node (testes).
 * Usa só sintaxe TypeScript "apagável" para funcionar com o type stripping do Node.
 */

export const STATUS_LIST = [
  "novo",
  "contatado",
  "respondeu",
  "interessado",
  "vendido",
  "nao_contatar",
] as const;
export type Status = (typeof STATUS_LIST)[number];

/** Ordem do funil: um status só "avança" (o robô nunca rebaixa um lead). */
export const STATUS_RANK: Record<Status, number> = {
  novo: 0,
  contatado: 1,
  respondeu: 2,
  interessado: 3,
  vendido: 4,
  nao_contatar: 5,
};

/** Retorna o status mais avançado entre o atual e o proposto (nao_contatar sempre vence). */
export function advanceStatus(atual: Status, proposto: Status): Status {
  if (atual === "nao_contatar" || proposto === "nao_contatar") return "nao_contatar";
  return STATUS_RANK[proposto] > STATUS_RANK[atual] ? proposto : atual;
}

// ---------------------------------------------------------------------------
// Telefones
// ---------------------------------------------------------------------------

export function digitsOnly(v: unknown): string {
  return String(v ?? "").replace(/\D/g, "");
}

/** Normaliza telefone brasileiro. Retorna { national, full } ou null. */
export function normalizePhoneBR(phone: unknown): { national: string; full: string } | null {
  let d = digitsOnly(phone);
  if (!d) return null;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if ((d.length === 11 || d.length === 12) && d.startsWith("0")) d = d.slice(1);
  if (!/^[1-9][1-9](\d{8}|\d{9})$/.test(d)) return null;
  return { national: d, full: "55" + d };
}

/** Celular brasileiro (DDD + 9 dígitos começando com 9). */
export function isLikelyWhatsApp(phone: unknown): boolean {
  const n = normalizePhoneBR(phone);
  return !!n && /^\d{2}9\d{8}$/.test(n.national);
}

/**
 * O WhatsApp às vezes entrega o número sem o 9º dígito (ex.: 551191234567).
 * Gera as duas formas para achar o lead.
 */
export function phoneVariants(waId: string): string[] {
  const d = digitsOnly(waId);
  const out = new Set<string>([d]);
  if (/^55\d{2}9\d{8}$/.test(d)) out.add(d.slice(0, 4) + d.slice(5));
  if (/^55\d{2}[6-9]\d{7}$/.test(d)) out.add(d.slice(0, 4) + "9" + d.slice(4));
  return [...out];
}

// ---------------------------------------------------------------------------
// Places API
// ---------------------------------------------------------------------------

export const PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.types",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "nextPageToken",
].join(",");

export interface Place {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
}

export function buildTextQuery(segmento: string, bairro: string, cidade?: string): string {
  let q = `${segmento.trim()} ${bairro.trim()}`;
  if (cidade) q += `, ${cidade.trim()}`;
  return q.trim();
}

export function ratingCountOf(p: Place | undefined): number {
  const n = Number(p?.userRatingCount);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Mantém userRatingCount < limite, sem duplicados (seen é atualizado) e fora dos bloqueados. */
export function filterPlaces(
  places: Place[] | undefined,
  limit: number,
  seen: Set<string>,
  blocked?: Set<string>,
): Place[] {
  const out: Place[] = [];
  for (const p of places ?? []) {
    if (!p?.id || seen.has(p.id) || blocked?.has(p.id)) continue;
    if (ratingCountOf(p) >= limit) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

export function placeToLead(p: Place, bairro: string, segmento: string) {
  const phone = p.internationalPhoneNumber || p.nationalPhoneNumber || "";
  return {
    place_id: p.id as string,
    nome: p.displayName?.text ?? "",
    endereco: p.formattedAddress ?? "",
    bairro_busca: bairro,
    categoria: segmento,
    avaliacoes: ratingCountOf(p),
    nota: p.rating ?? null,
    telefone: p.nationalPhoneNumber || p.internationalPhoneNumber || "",
    whatsapp: normalizePhoneBR(phone)?.full ?? null,
    provavel_whatsapp: isLikelyWhatsApp(phone),
    maps_url: p.googleMapsUri ?? null,
    site: p.websiteUri ?? null,
  };
}

export function buildReviewUrl(placeId: string): string {
  return placeId
    ? "https://search.google.com/local/writereview?placeid=" + encodeURIComponent(placeId)
    : "";
}

export function fillTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

// ---------------------------------------------------------------------------
// Pedido de saída ("não contatar")
// ---------------------------------------------------------------------------

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const OPT_OUT_EXACT = new Set(["sair", "pare", "parar", "stop", "cancelar", "remover", "descadastrar"]);
const OPT_OUT_PATTERNS = [
  /\bnao (quero|tenho interesse|me (mande|manda|envie|envia|chame|chama)|mande mais|envie mais)\b/,
  /\b(para|pare|parem) de (me )?(mandar|enviar|chamar)\b/,
  /\b(me )?(tira|tire|remova|remove|exclua|exclui) (meu numero|da lista|daqui)\b/,
  /\bsem interesse\b/,
  /\bdescadastr/,
  /\bspam\b/,
];

/**
 * Detecção determinística (antes da IA) de quem pediu para sair.
 * Na dúvida, a IA também tem a ferramenta marcar_nao_contatar.
 */
export function isOptOut(text: string): boolean {
  const t = semAcento(text).replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  if (!t) return false;
  if (OPT_OUT_EXACT.has(t)) return true;
  return OPT_OUT_PATTERNS.some((re) => re.test(t));
}

// ---------------------------------------------------------------------------
// Disparo: horário, limites e trava de segurança
// ---------------------------------------------------------------------------

/** Hora e dia da semana em America/Sao_Paulo (UTC-3, sem horário de verão desde 2019). */
export function horaSaoPaulo(now: Date): { hora: number; diaSemana: number; dataISO: string } {
  const sp = new Date(now.getTime() - 3 * 3600 * 1000);
  return {
    hora: sp.getUTCHours(),
    diaSemana: sp.getUTCDay(), // 0 = domingo
    dataISO: sp.toISOString().slice(0, 10),
  };
}

export interface DisparoConfig {
  robo_ativo: boolean;
  limite_diario: number;
  hora_inicio: number; // inclusive
  hora_fim: number; // exclusiva
  dias_semana: number[]; // 0 = domingo
}

export interface DisparoEstado {
  enviados_hoje: number;
  enviados_7d: number;
  optouts_7d: number;
  bloqueios_7d: number; // usuários que bloquearam / denunciaram (quando o webhook informar)
}

/**
 * Decide se o robô pode disparar agora e quantas mensagens.
 * Trava automática: se ≥ 10% dos contatos dos últimos 7 dias pediram para sair
 * (com ao menos 10 envios), ou se houve 2+ bloqueios, para de disparar.
 */
export function podeDisparar(
  cfg: DisparoConfig,
  st: DisparoEstado,
  now: Date,
  lote: number,
): { ok: true; quantidade: number } | { ok: false; motivo: string } {
  if (!cfg.robo_ativo) return { ok: false, motivo: "robô desligado" };
  const { hora, diaSemana } = horaSaoPaulo(now);
  if (!cfg.dias_semana.includes(diaSemana)) return { ok: false, motivo: "fora dos dias de envio" };
  if (hora < cfg.hora_inicio || hora >= cfg.hora_fim) return { ok: false, motivo: "fora do horário comercial" };
  if (st.bloqueios_7d >= 2) return { ok: false, motivo: "trava: bloqueios recentes" };
  if (st.enviados_7d >= 10 && st.optouts_7d / st.enviados_7d >= 0.1) {
    return { ok: false, motivo: "trava: muitos pedidos para sair" };
  }
  const restante = cfg.limite_diario - st.enviados_hoje;
  if (restante <= 0) return { ok: false, motivo: "limite diário atingido" };
  return { ok: true, quantidade: Math.min(restante, lote) };
}

// ---------------------------------------------------------------------------
// Webhook do WhatsApp
// ---------------------------------------------------------------------------

export interface WaInbound {
  id: string;
  from: string;
  timestamp: string;
  texto: string;
  tipo: string;
}
export interface WaStatus {
  id: string;
  status: string; // sent | delivered | read | failed
  recipient: string;
  erroCodigo?: number;
  erroTitulo?: string;
}

/** Extrai mensagens recebidas, status de entrega e alertas de qualidade do payload da Meta. */
// deno-lint-ignore no-explicit-any
export function parseWhatsAppWebhook(body: any): {
  mensagens: WaInbound[];
  status: WaStatus[];
  qualidade: string[];
} {
  const mensagens: WaInbound[] = [];
  const status: WaStatus[] = [];
  const qualidade: string[] = [];
  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const v = change?.value ?? {};
      if (change?.field === "phone_number_quality_update") {
        qualidade.push(String(v.event ?? v.current_limit ?? "update"));
        continue;
      }
      for (const m of v.messages ?? []) {
        let texto = "";
        if (m.type === "text") texto = m.text?.body ?? "";
        else if (m.type === "button") texto = m.button?.text ?? m.button?.payload ?? "";
        else if (m.type === "interactive") {
          texto = m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "";
        } else texto = `[${m.type}]`;
        mensagens.push({ id: m.id, from: m.from, timestamp: m.timestamp, texto, tipo: m.type });
      }
      for (const s of v.statuses ?? []) {
        status.push({
          id: s.id,
          status: s.status,
          recipient: s.recipient_id,
          erroCodigo: s.errors?.[0]?.code,
          erroTitulo: s.errors?.[0]?.title,
        });
      }
    }
  }
  return { mensagens, status, qualidade };
}

/** Eventos de qualidade que devem pausar o robô. */
export function qualidadeExigePausa(evento: string): boolean {
  return /FLAGGED|DOWNGRADE|RED|LOW/i.test(evento);
}

// ---------------------------------------------------------------------------
// Assinaturas (HMAC SHA-256) — Web Crypto, igual no Deno e no Node
// ---------------------------------------------------------------------------

export async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Header X-Hub-Signature-256 da Meta: "sha256=<hex>" do corpo bruto com o App Secret. */
export async function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const esperado = await hmacSha256Hex(appSecret, rawBody);
  return timingSafeEqual(header.slice(7), esperado);
}

/**
 * Header x-signature do Mercado Pago: "ts=...,v1=...".
 * Manifesto: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" (data.id em minúsculas se alfanumérico).
 */
export async function verifyMercadoPagoSignature(
  header: string | null,
  requestId: string | null,
  dataId: string,
  secret: string,
): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.trim().split("=", 2) as [string, string]),
  );
  if (!parts.ts || !parts.v1) return false;
  let manifest = `id:${dataId.toLowerCase()};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${parts.ts};`;
  return timingSafeEqual(parts.v1, await hmacSha256Hex(secret, manifest));
}

// ---------------------------------------------------------------------------
// Painel: chegaram × convertidos (mesma regra do Utils.gs da planilha)
// ---------------------------------------------------------------------------

export interface LeadPainel {
  status: string;
  encontrado_em: string | Date | null;
  data_venda: string | Date | null;
}

const DIA = 86400000;

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Início do dia em São Paulo, como instante UTC. */
function inicioDiaSP(d: Date): number {
  const sp = d.getTime() - 3 * 3600 * 1000;
  return Math.floor(sp / DIA) * DIA + 3 * 3600 * 1000;
}

function ddmm(t: number): string {
  const d = new Date(t - 3 * 3600 * 1000);
  return String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

export function percentChange(atual: number, anterior: number): number | null {
  if (!anterior) return null;
  return Math.round(((atual - anterior) / anterior) * 1000) / 10;
}

export function buildDashboard(leads: LeadPainel[], optOuts: number, days: number, now: Date) {
  const bucketDays = days > 31 ? 7 : 1;
  const n = Math.max(1, Math.ceil(days / bucketDays));
  const totalDays = n * bucketDays;
  const end = inicioDiaSP(now) + DIA;
  const start = end - totalDays * DIA;
  const prevStart = start - totalDays * DIA;

  const buckets = Array.from({ length: n }, (_, i) => {
    const b = start + i * bucketDays * DIA;
    return {
      label: bucketDays === 1 ? ddmm(b) : `${ddmm(b)}–${ddmm(b + (bucketDays - 1) * DIA)}`,
      chegaram: 0,
      convertidos: 0,
    };
  });

  const r = { chegaram: 0, chegaramAnterior: 0, convertidos: 0, convertidosAnterior: 0 };
  const count = (v: string | Date | null, campo: "chegaram" | "convertidos") => {
    const d = toDate(v);
    if (!d) return;
    const t = d.getTime();
    if (t >= start && t < end) {
      r[campo]++;
      buckets[Math.floor((t - start) / DIA / bucketDays)][campo]++;
    } else if (t >= prevStart && t < start) {
      r[campo === "chegaram" ? "chegaramAnterior" : "convertidosAnterior"]++;
    }
  };

  const funil: Record<string, number> = {};
  for (const s of STATUS_LIST) funil[s] = 0;
  for (const l of leads) {
    count(l.encontrado_em, "chegaram");
    if (l.status === "vendido") count(l.data_venda, "convertidos");
    if (l.status in funil && l.status !== "nao_contatar") funil[l.status]++;
  }
  funil.nao_contatar = optOuts;
  const total = Object.values(funil).reduce((a, b) => a + b, 0);

  return {
    dias: totalDays,
    porSemana: bucketDays === 7,
    inicio: ddmm(start),
    fim: ddmm(end - DIA),
    chegaram: r.chegaram,
    convertidos: r.convertidos,
    variacaoChegaram: percentChange(r.chegaram, r.chegaramAnterior),
    variacaoConvertidos: percentChange(r.convertidos, r.convertidosAnterior),
    taxaPeriodo: r.chegaram ? Math.round((r.convertidos / r.chegaram) * 1000) / 10 : null,
    buckets,
    funil,
    total,
    taxaGeral: total ? Math.round((funil.vendido / total) * 1000) / 10 : null,
  };
}
