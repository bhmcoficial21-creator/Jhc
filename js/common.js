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

/* ---- Armazenamento (versão demonstração: navegador local) ----
   Para produção trocar por Supabase, mantendo as mesmas funções. */
const STORE_KEY = "barbeskin:agendamentos";
const CLIENT_KEY = "barbeskin:cliente";
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};
const getBookings = () => store.get(STORE_KEY, []);
const saveBookings = (list) => store.set(STORE_KEY, list);
const ativo = (b) => b.status !== "cancelado";

function barberFree(barberId, date, start, end, bookings = getBookings()) {
  return !bookings.some((b) => ativo(b) && b.barbeiro === barberId && b.data === date && start < b.fim && end > b.inicio);
}

/* ---- Contas de cliente (demonstração local — trocar por Supabase Auth) ---- */
const CONTAS_KEY = "barbeskin:contas";
const SESSAO_KEY = "barbeskin:sessao";
const PENDENTE_KEY = "barbeskin:pendente";
const getContas = () => store.get(CONTAS_KEY, []);
const saveContas = (l) => store.set(CONTAS_KEY, l);
async function hashSenha(senha) {
  const txt = "barbeskin:" + senha;
  if (window.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 0; for (const c of txt) h = (h * 31 + c.charCodeAt(0)) | 0; return "f" + h;
}
function sessaoId() {
  try { return sessionStorage.getItem(SESSAO_KEY) || localStorage.getItem(SESSAO_KEY); } catch { return null; }
}
function usuarioAtual() { const id = sessaoId(); return id ? getContas().find((c) => c.id === id) || null : null; }
function iniciarSessao(id, lembrar) {
  try { (lembrar ? localStorage : sessionStorage).setItem(SESSAO_KEY, id); } catch {}
}
function sair() { try { sessionStorage.removeItem(SESSAO_KEY); localStorage.removeItem(SESSAO_KEY); } catch {} }
function atualizarConta(id, patch) {
  const l = getContas(); const c = l.find((x) => x.id === id); if (c) { Object.assign(c, patch); saveContas(l); } return c;
}

/* ---- Sessão do barbeiro ---- */
const SESSAO_BARB_KEY = "barbeskin:sessao-barbeiro";
function barbeiroLogado() {
  let id = null; try { id = sessionStorage.getItem(SESSAO_BARB_KEY) || localStorage.getItem(SESSAO_BARB_KEY); } catch {}
  return id && barberById[id] ? barberById[id] : null;
}
function entrarBarbeiro(id, lembrar) { try { (lembrar ? localStorage : sessionStorage).setItem(SESSAO_BARB_KEY, id); } catch {} }
function sairBarbeiro() { try { sessionStorage.removeItem(SESSAO_BARB_KEY); localStorage.removeItem(SESSAO_BARB_KEY); } catch {} }

/* ---- Agendamentos do cliente ---- */
const agora = () => { const d = new Date(); return { data: ymd(d), min: d.getHours() * 60 + d.getMinutes() }; };
const jaPassou = (b) => { const n = agora(); return b.data < n.data || (b.data === n.data && b.fim <= n.min); };
function agendamentosDoCliente(c) {
  if (!c) return [];
  const tel = String(c.tel).replace(/\D/g, "");
  return getBookings().filter((b) => b.clienteId === c.id || String(b.tel).replace(/\D/g, "") === tel)
    .sort((a, b) => (a.data + fromMin(a.inicio)).localeCompare(b.data + fromMin(b.inicio)));
}
function atualizarAgendamento(id, patch) {
  const all = getBookings(); const b = all.find((x) => x.id === id);
  if (b) { Object.assign(b, patch); saveBookings(all); } return b;
}
const FICHA_KEY = "barbeskin:fichas";
const getFichas = () => store.get(FICHA_KEY, {});
const telKey = (t) => String(t).replace(/\D/g, "");
function dataLonga(s) { const d = parseYmd(s); return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`; }
