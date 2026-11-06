const params = new URLSearchParams(location.search);
let modo = params.get("modo") === "cadastro" ? "cadastro" : "login";
const form = $("#authForm"), msg = $("#authMsg");
const planoEscolhido = PLANOS.find((p) => p.id === params.get("plano"));

function destino() {
  const volta = params.get("volta");
  return volta === "planos" ? "index.html#planos" : volta === "agendar" ? "index.html#agendar" : "index.html";
}

function render() {
  const cad = modo === "cadastro";
  $("#authTitle").textContent = cad ? "Crie sua conta" : "Bem-vindo de volta";
  $("#authSub").textContent = planoEscolhido
    ? `${cad ? "Cadastre-se" : "Entre"} para assinar o ${planoEscolhido.nome}`
    : cad ? "Cadastre-se para agendar na Barbe Skin" : "Entre para agendar na Barbe Skin";
  $$("[data-only]").forEach((el) => (el.hidden = el.dataset.only !== modo));
  form.senha.autocomplete = cad ? "new-password" : "current-password";
  $("#authSubmit").innerHTML = `${cad ? "Criar conta" : "Entrar"} <span aria-hidden="true">→</span>`;
  $("#authSwitch").innerHTML = cad
    ? `Já tem conta? <button type="button" class="auth-link strong" data-modo="login">Entrar</button>`
    : `Não tem conta? <button type="button" class="auth-link strong" data-modo="cadastro">Cadastre-se</button>`;
  msg.textContent = ""; msg.className = "auth-msg";
}

const maskTel = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
form.tel.addEventListener("input", (e) => (e.target.value = maskTel(e.target.value)));

const erro = (t) => { msg.textContent = t; msg.className = "auth-msg is-error"; };
const okMsg = (t) => { msg.textContent = t; msg.className = "auth-msg is-ok"; };

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = form.email.value.trim().toLowerCase(), senha = form.senha.value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro("Informe um e-mail válido.");
  if (senha.length < 6) return erro("A senha precisa ter pelo menos 6 caracteres.");
  const contas = getContas();
  let conta;
  if (modo === "cadastro") {
    const nome = form.nome.value.trim(), tel = form.tel.value.trim();
    if (nome.length < 2) return erro("Informe seu nome.");
    if (tel.replace(/\D/g, "").length < 10) return erro("Informe um WhatsApp válido com DDD.");
    if (contas.some((c) => c.email === email)) return erro("Esse e-mail já tem conta. Entre com sua senha.");
    conta = { id: "c" + Date.now().toString(36), nome, tel, email, hash: await hashSenha(senha), criadoEm: new Date().toISOString(), cabelo: "", ultimo: null, plano: null };
    contas.push(conta); saveContas(contas);
    iniciarSessao(conta.id, true);
  } else {
    conta = contas.find((c) => c.email === email);
    if (!conta || conta.hash !== (await hashSenha(senha))) return erro("E-mail ou senha incorretos.");
    iniciarSessao(conta.id, form.lembrar.checked);
  }
  if (planoEscolhido) atualizarConta(conta.id, { plano: { id: planoEscolhido.id, status: "pendente", desde: new Date().toISOString() } });
  okMsg(`Tudo certo, ${conta.nome.split(" ")[0]}! Redirecionando…`);
  setTimeout(() => (location.href = destino()), 600);
});

document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.modo) { modo = t.dataset.modo; render(); }
  else if (t.id === "eye") {
    const show = form.senha.type === "password";
    form.senha.type = show ? "text" : "password";
    t.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha"); t.classList.toggle("is-on", show);
  }
  else if (t.id === "esqueci") okMsg("Fale com a barbearia pelo WhatsApp para redefinir sua senha. Na versão online, o link chega no seu e-mail.");
  else if (t.id === "google") okMsg("O login com Google será ativado quando o site estiver no ar.");
});

const logado = usuarioAtual();
if (logado && planoEscolhido) {
  atualizarConta(logado.id, { plano: { id: planoEscolhido.id, status: "pendente", desde: new Date().toISOString() } });
  location.replace(destino());
} else if (logado) location.replace(destino());
render();
