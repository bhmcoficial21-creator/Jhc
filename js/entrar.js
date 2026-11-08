/* Login e cadastro (banco online).
   - Cliente: entra ou cria conta com e-mail e senha.
   - Barbeiro: entra com e-mail e senha; no 1º acesso usa o código da barbearia para virar conta de barbeiro. */
const params = new URLSearchParams(location.search);
let modo = params.get("modo") === "cadastro" ? "cadastro" : "login";
let perfil = params.get("perfil") === "barbeiro" ? "barbeiro" : "cliente";
const form = $("#authForm"), msg = $("#authMsg"), barbForm = $("#barbForm");
const planoEscolhido = PLANOS.find((p) => p.id === params.get("plano"));
let barbEscolhido = BARBEIROS[0].id;

function destino() {
  const volta = params.get("volta");
  return volta === "planos" ? "index.html#planos" : volta === "agendar" ? "index.html#agendar" : volta === "perfil" ? "perfil.html" : "index.html";
}
const avisar = (el, t, tipo) => { el.textContent = t; el.className = "auth-msg" + (tipo ? " is-" + tipo : ""); };
const ocupado = (f, sim, txt) => { const b = f.querySelector('button[type="submit"]'); b.disabled = sim; if (txt) b.innerHTML = txt; };

function traduzErro(e) {
  const m = (e?.message || "").toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Esse e-mail já tem conta. Entre com sua senha.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail: enviamos um link para a sua caixa de entrada.";
  if (m.includes("rate limit")) return "Muitas tentativas. Espere um pouco e tente de novo.";
  if (m.includes("password")) return "A senha precisa ter pelo menos 6 caracteres.";
  return "Não foi possível agora. Verifique a internet e tente de novo.";
}

function render() {
  const cad = modo === "cadastro", barb = perfil === "barbeiro";
  $$(".auth-tab").forEach((t) => { const on = t.dataset.perfil === perfil; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); });
  barbForm.hidden = !barb;
  [form, $(".auth-or"), $("#google"), $("#authSwitch")].forEach((el) => el && (el.hidden = barb));
  if (barb) {
    $("#authTitle").textContent = "Agenda do barbeiro";
    $("#authSub").textContent = "Veja na hora quem marcou com você";
    $("#barbPick").innerHTML = BARBEIROS.map((x) => `<button type="button" role="radio" aria-checked="${x.id === barbEscolhido}" class="barb-opt${x.id === barbEscolhido ? " is-active" : ""}" data-barb="${x.id}"><span>${esc(x.nome[0])}</span>${esc(x.nome)}</button>`).join("");
    return;
  }
  $("#authTitle").textContent = cad ? "Crie sua conta" : "Bem-vindo de volta";
  $("#authSub").textContent = planoEscolhido ? `${cad ? "Cadastre-se" : "Entre"} para assinar o ${planoEscolhido.nome}` : cad ? "Cadastre-se para agendar" : "Entre para agendar";
  $$("[data-only]").forEach((el) => (el.hidden = el.dataset.only !== modo));
  form.senha.autocomplete = cad ? "new-password" : "current-password";
  $("#authSubmit").innerHTML = `${cad ? "Criar conta" : "Entrar"} <span aria-hidden="true">→</span>`;
  $("#authSwitch").innerHTML = cad
    ? `Já tem conta? <button type="button" class="auth-link strong" data-modo="login">Entrar</button>`
    : `Não tem conta? <button type="button" class="auth-link strong" data-modo="cadastro">Cadastre-se</button>`;
  avisar(msg, "");
}

const maskTel = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
form.tel.addEventListener("input", (e) => (e.target.value = maskTel(e.target.value)));

/* ---------- cliente ---------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = form.email.value.trim().toLowerCase(), senha = form.senha.value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return avisar(msg, "Informe um e-mail válido.", "error");
  if (senha.length < 6) return avisar(msg, "A senha precisa ter pelo menos 6 caracteres.", "error");
  ocupado(form, true);
  try {
    if (modo === "cadastro") {
      const nome = form.nome.value.trim(), tel = form.tel.value.trim();
      if (nome.length < 2) { ocupado(form, false); return avisar(msg, "Informe seu nome.", "error"); }
      if (tel.replace(/\D/g, "").length < 10) { ocupado(form, false); return avisar(msg, "Informe um WhatsApp válido com DDD.", "error"); }
      const { data, error } = await SB.auth.signUp({ email, password: senha, options: { data: { nome, tel } } });
      if (error) throw error;
      if (!data.session) { ocupado(form, false); return avisar(msg, "Conta criada! Confirme pelo link que enviamos ao seu e-mail e depois entre.", "ok"); }
    } else {
      const { error } = await SB.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
    }
    await carregarSessao();
    if (planoEscolhido) await atualizarPerfil({ plano: planoEscolhido.id, plano_status: "pendente" }).catch(() => {});
    const u = usuarioAtual();
    avisar(msg, `Tudo certo, ${(u?.nome || "").split(" ")[0] || "bem-vindo"}! Redirecionando…`, "ok");
    setTimeout(() => (location.href = barbeiroLogado() ? "agenda.html" : destino()), 500);
  } catch (er) { ocupado(form, false); avisar(msg, traduzErro(er), "error"); }
});

/* ---------- barbeiro ---------- */
barbForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const m = $("#barbMsg");
  const email = barbForm.email.value.trim().toLowerCase(), senha = barbForm.senha.value, codigo = barbForm.codigo.value.trim().toUpperCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return avisar(m, "Informe um e-mail válido.", "error");
  if (senha.length < 6) return avisar(m, "A senha precisa ter pelo menos 6 caracteres.", "error");
  ocupado(barbForm, true);
  try {
    let { error } = await SB.auth.signInWithPassword({ email, password: senha });
    if (error && codigo && error.message.toLowerCase().includes("invalid login")) {
      // 1º acesso: cria a conta do barbeiro
      const r = await SB.auth.signUp({ email, password: senha, options: { data: { nome: barberById[barbEscolhido].nome, tel: "" } } });
      if (r.error) throw r.error;
      if (!r.data.session) { ocupado(barbForm, false); return avisar(m, "Conta criada! Confirme pelo link do seu e-mail e entre de novo com o mesmo código.", "ok"); }
      error = null;
    }
    if (error) throw error;
    await carregarSessao();
    if (!barbeiroLogado()) {
      if (!codigo) { ocupado(barbForm, false); return avisar(m, "Primeiro acesso: digite o código da barbearia.", "error"); }
      const { data: ok, error: e2 } = await SB.rpc("ativar_barbeiro", { barbeiro: barbEscolhido, codigo });
      if (e2) throw e2;
      if (!ok) { ocupado(barbForm, false); return avisar(m, "Código incorreto para esse barbeiro.", "error"); }
      await carregarSessao();
    }
    avisar(m, `Bem-vindo, ${barbeiroLogado().nome}! Abrindo sua agenda…`, "ok");
    setTimeout(() => (location.href = "agenda.html"), 500);
  } catch (er) { ocupado(barbForm, false); avisar(m, traduzErro(er), "error"); }
});

document.addEventListener("click", async (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.modo) { modo = t.dataset.modo; render(); }
  else if (t.dataset.perfil) { perfil = t.dataset.perfil; render(); }
  else if (t.dataset.barb) { barbEscolhido = t.dataset.barb; render(); }
  else if (t.id === "eye") {
    const show = form.senha.type === "password";
    form.senha.type = show ? "text" : "password";
    t.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha"); t.classList.toggle("is-on", show);
  } else if (t.id === "esqueci") {
    const email = form.email.value.trim();
    if (!email) return avisar(msg, "Digite seu e-mail acima e toque em \"Esqueci a senha\" de novo.", "error");
    const { error } = await SB.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("?")[0] });
    avisar(msg, error ? traduzErro(error) : "Enviamos um link para redefinir sua senha no seu e-mail.", error ? "error" : "ok");
  } else if (t.id === "google") avisar(msg, "O login com Google será ativado quando o site estiver no endereço definitivo.", "ok");
});

render();
carregarSessao().then(() => {
  if (perfil === "barbeiro" && barbeiroLogado()) location.replace("agenda.html");
  else if (perfil === "cliente" && usuarioAtual() && !planoEscolhido) location.replace(barbeiroLogado() ? "agenda.html" : destino());
  else if (usuarioAtual() && planoEscolhido) atualizarPerfil({ plano: planoEscolhido.id, plano_status: "pendente" }).finally(() => location.replace(destino()));
});
