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
