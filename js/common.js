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

/* horários ocupados de um dia (sem dados pessoais).
   Se a agenda online não responder em 6s, os horários aparecem mesmo assim (modo sem conexão). */
const OCUPADOS = {};
let AGENDA_OFFLINE = false;
const comPrazo = (promessa, ms) => Promise.race([promessa, new Promise((_, n) => setTimeout(() => n(new Error("tempo_esgotado")), ms))]);
async function buscarOcupados(dia) {
  try {
    const { data, error } = await comPrazo(SB.rpc("horarios_ocupados", { dia }), 6000);
    if (error) throw error;
    AGENDA_OFFLINE = false;
    OCUPADOS[dia] = data.map((r) => ({ barbeiro: r.barbeiro_id, inicio: r.inicio, fim: r.fim }));
  } catch {
    AGENDA_OFFLINE = true;
    const fila = store.get(FILA_KEY, []);   // ao menos não deixa marcar em cima de um pedido já guardado aqui
    OCUPADOS[dia] = fila.filter((f) => f.data === dia).map((f) => ({ barbeiro: f.barbeiro, inicio: f.inicio, fim: f.fim }));
  }
  return OCUPADOS[dia];
}
const barberFree = (barberId, dia, ini, fim) => !(OCUPADOS[dia] || []).some((b) => b.barbeiro === barberId && ini < b.fim && fim > b.inicio);

/* ---- cliente SEM cadastro: o celular guarda a "chave" de cada horário ---- */
const MEUS_KEY = "barbeskin:meus-horarios", EU_KEY = "barbeskin:eu";
const minhasChaves = () => store.get(MEUS_KEY, []);
const meusDados = () => store.get(EU_KEY, { nome: "", tel: "" });
const salvarMeusDados = (d) => store.set(EU_KEY, { ...meusDados(), ...d });

const FILA_KEY = "barbeskin:fila";      // pedidos guardados quando a agenda online não respondeu
const ehErroDeRede = (e) => !e || !e.code || /fetch|network|tempo_esgotado|Load failed/i.test(e.message || "");

async function enviarAgendamento(b) {
  const { data, error } = await comPrazo(SB.rpc("agendar", {
    p_barbeiro: b.barbeiro, p_data: b.data, p_inicio: b.inicio, p_fim: b.fim, p_servicos: b.servicos, p_preco: b.preco,
    p_nome: b.nome, p_tel: b.tel, p_cabelo: b.cabelo || "", p_obs: b.obs || "",
  }), 10000);
  if (error) {
    const m = error.message || "", e = new Error(m); e.code = error.code;
    if (error.code === "23P01") e.ocupado = true;
    if (m.includes("limite_atingido")) e.limite = true;
    throw e;
  }
  const r = data[0];
  store.set(MEUS_KEY, [...minhasChaves().filter((x) => x.id !== r.id), { id: r.id, chave: r.chave }].slice(-30));
  return { ...b, id: r.id, status: "confirmado", criadoEm: new Date().toISOString() };
}
async function criarAgendamento(b) {
  try { return await enviarAgendamento(b); }
  catch (e) {
    if (e.ocupado || e.limite || !ehErroDeRede(e)) throw e;
    // sem conexão com a agenda: guarda no celular e envia sozinho depois
    const item = { ...b, id: "fila-" + Date.now().toString(36), status: "confirmado", pendente: true, criadoEm: new Date().toISOString() };
    store.set(FILA_KEY, [...store.get(FILA_KEY, []), item]);
    return item;
  }
}
let sincronizando = false;
async function sincronizarFila() {
  if (sincronizando) return; sincronizando = true;
  try {
    for (const item of store.get(FILA_KEY, [])) {
      try { await enviarAgendamento(item); }
      catch (e) { if (ehErroDeRede(e)) break; item.falhou = e.ocupado ? "ocupado" : "erro"; store.set(FILA_KEY, store.get(FILA_KEY, []).map((x) => x.id === item.id ? item : x)); continue; }
      store.set(FILA_KEY, store.get(FILA_KEY, []).filter((x) => x.id !== item.id));
    }
  } finally { sincronizando = false; }
}
addEventListener("online", sincronizarFila);
setTimeout(sincronizarFila, 1500);
async function meusAgendamentos() {
  const fila = store.get(FILA_KEY, []).map((f) => ({ ...f, status: f.falhou === "ocupado" ? "cancelado" : f.status }));
  const itens = minhasChaves(); if (!itens.length) return fila;
  const { data, error } = await SB.rpc("meus_horarios", { p_itens: itens });
  if (error) throw error;
  return [...data.map((r) => ({ id: r.id, barbeiro: r.barbeiro_id, data: r.data, inicio: r.inicio, fim: r.fim, servicos: r.servicos,
    preco: Number(r.preco), nome: r.nome, status: r.status, criadoEm: r.criado_em })), ...fila]
    .sort((x, y) => (x.data + fromMin(x.inicio)).localeCompare(y.data + fromMin(y.inicio)));
}
async function cancelarMeuHorario(id) {
  if (String(id).startsWith("fila-")) { store.set(FILA_KEY, store.get(FILA_KEY, []).filter((x) => x.id !== id)); return true; }
  const it = minhasChaves().find((x) => x.id === id); if (!it) return false;
  const { data, error } = await SB.rpc("cancelar_horario", { p_id: id, p_chave: it.chave });
  if (error) throw error;
  return data;
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
async function lerFichas(tels) {      // barbeiro: fichas pelo WhatsApp do cliente
  const ids = [...new Set(tels.map(telKey).filter(Boolean))]; if (!ids.length) return {};
  const { data } = await SB.from("fichas").select("tel,texto").in("tel", ids);
  return Object.fromEntries((data || []).map((r) => [r.tel, r.texto]));
}
async function salvarFicha(tel, texto) {
  const { error } = await SB.from("fichas").upsert({ tel: telKey(tel), texto, atualizado_em: new Date().toISOString() });
  if (error) throw error;
}
/* tempo real: avisa quando algum agendamento muda */
function ouvirAgendamentos(cb) {
  return SB.channel("agenda").on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, (p) => cb(p)).subscribe();
}
