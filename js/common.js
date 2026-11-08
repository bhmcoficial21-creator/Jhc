/* Utilitários compartilhados entre o site e a área do barbeiro */
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}` : `${m} min`);
const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const fromMin = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const servById = Object.fromEntries(SERVICOS.map((s) => [s.id, s]));
const barberById = Object.fromEntries(BARBEIROS.map((b) => [b.id, b]));

/* ---- Preferências locais (só conveniência deste aparelho) ---- */
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};
const PENDENTE_KEY = "barbeskin:pendente";
const telKey = (t) => String(t).replace(/\D/g, "");
function dataLonga(s) { const d = parseYmd(s); return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`; }
const agora = () => { const d = new Date(); return { data: ymd(d), min: d.getHours() * 60 + d.getMinutes() }; };
const jaPassou = (b) => { const n = agora(); return b.data < n.data || (b.data === n.data && b.fim <= n.min); };
const ativo = (b) => b.status !== "cancelado";

/* =========================================================
   BANCO ONLINE (Supabase): cliente e barbeiro veem a mesma agenda
   ========================================================= */
const SB = window.supabase.createClient(SUPABASE.url, SUPABASE.chave, { auth: { persistSession: true, autoRefreshToken: true } });
const AUTH = { user: null, perfil: null };

// linha do banco → formato usado nas páginas
const doBanco = (r) => ({ id: r.id, clienteId: r.cliente_id, barbeiro: r.barbeiro_id, data: r.data, inicio: r.inicio, fim: r.fim,
  servicos: r.servicos, preco: Number(r.preco), nome: r.nome, tel: r.tel, cabelo: r.cabelo, obs: r.obs, pagamento: r.pagamento,
  status: r.status, criadoEm: r.criado_em });

async function carregarSessao() {
  const { data: { session } } = await SB.auth.getSession();
  if (!session) { AUTH.user = AUTH.perfil = null; return null; }
  AUTH.user = session.user;
  const { data } = await SB.from("perfis").select("*").eq("id", session.user.id).maybeSingle();
  AUTH.perfil = data;
  return data;
}
function usuarioAtual() {
  if (!AUTH.perfil) return null;
  const p = AUTH.perfil;
  return { ...p, email: AUTH.user?.email || "", plano: p.plano ? { id: p.plano, status: p.plano_status || "pendente" } : null };
}
function barbeiroLogado() {
  const p = AUTH.perfil;
  return p && p.papel === "barbeiro" && barberById[p.barbeiro_id] ? barberById[p.barbeiro_id] : null;
}
async function sair() { await SB.auth.signOut(); AUTH.user = AUTH.perfil = null; }

async function atualizarPerfil(patch) {
  if (!AUTH.user) return null;
  const { data, error } = await SB.from("perfis").update(patch).eq("id", AUTH.user.id).select().single();
  if (error) throw error;
  AUTH.perfil = data; return usuarioAtual();
}

/* horários ocupados de um dia (sem dados pessoais) */
const OCUPADOS = {};
async function buscarOcupados(dia) {
  const { data, error } = await SB.rpc("horarios_ocupados", { dia });
  if (error) throw error;
  OCUPADOS[dia] = data.map((r) => ({ barbeiro: r.barbeiro_id, inicio: r.inicio, fim: r.fim }));
  return OCUPADOS[dia];
}
const barberFree = (barberId, dia, ini, fim) => !(OCUPADOS[dia] || []).some((b) => b.barbeiro === barberId && ini < b.fim && fim > b.inicio);

async function criarAgendamento(b) {
  const { data, error } = await SB.from("agendamentos").insert({
    barbeiro_id: b.barbeiro, data: b.data, inicio: b.inicio, fim: b.fim, servicos: b.servicos, preco: b.preco,
    nome: b.nome, tel: b.tel, cabelo: b.cabelo || "", obs: b.obs || "", pagamento: b.pagamento || "na_barbearia",
  }).select().single();
  if (error) { if (error.code === "23P01") { const e = new Error("ocupado"); e.ocupado = true; throw e; } throw error; }
  return doBanco(data);
}
async function meusAgendamentos() {
  if (!AUTH.user) return [];
  const { data, error } = await SB.from("agendamentos").select("*").eq("cliente_id", AUTH.user.id).order("data").order("inicio");
  if (error) throw error;
  return data.map(doBanco);
}
async function agendamentosEntre(de, ate) {   // barbeiro: agenda de um período
  const { data, error } = await SB.from("agendamentos").select("*").gte("data", de).lte("data", ate).order("data").order("inicio");
  if (error) throw error;
  return data.map(doBanco);
}
async function mudarStatus(id, status) {
  const { error } = await SB.from("agendamentos").update({ status }).eq("id", id);
  if (error) throw error;
}
async function lerFicha(clienteId) {
  const { data } = await SB.from("fichas").select("texto").eq("cliente_id", clienteId).maybeSingle();
  return data?.texto || "";
}
async function lerFichas(ids) {
  if (!ids.length) return {};
  const { data } = await SB.from("fichas").select("cliente_id,texto").in("cliente_id", ids);
  return Object.fromEntries((data || []).map((r) => [r.cliente_id, r.texto]));
}
async function salvarFicha(clienteId, texto) {
  const { error } = await SB.from("fichas").upsert({ cliente_id: clienteId, texto, atualizado_em: new Date().toISOString() });
  if (error) throw error;
}
/* tempo real: avisa quando algum agendamento muda */
function ouvirAgendamentos(cb) {
  return SB.channel("agenda").on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, (p) => cb(p)).subscribe();
}
