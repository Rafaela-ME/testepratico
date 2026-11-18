/* =========================================================
   Aquecimento Solar da Piscina Escolar — script
   JavaScript puro, sem bibliotecas.
   ========================================================= */

/* ---------------------------------------------------------
   0) CONFIGURAÇÃO DOS VÍDEOS EM LIBRAS
   Para cada seção, cole aqui o link do vídeo em Libras:
     - link do YouTube (ex.: "https://youtu.be/XXXXXXXXXXX"), OU
     - arquivo enviado ao GitHub (ex.: "videos/libras-s1.mp4").
   Se deixar "", o site procura sozinho "videos/libras-ID.mp4"
   (ex.: videos/libras-s1.mp4) e, se não achar, mostra um aviso.
   --------------------------------------------------------- */
const VIDEOS_LIBRAS = {
  capa: "", roteiro: "", s1: "", s2: "", s3: "", s4: "",          // Rafaela
  integracao: "", s5: "", s6: "", s7: "", s8: "",                 // Beatriz
  s9: "", s10: "", s11: "", s12: "", s13: "", s14: "",            // Amanda
  s15: "", s16: "", s17: "", s18: "", conclusao: "",              // Daniel
  fontes: "",
};

/* Utilidades */
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));
const fmt = (n, casas = 1) => n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
const fmtInt = (n) => Math.round(n).toLocaleString("pt-BR");
function guardar(chave, valor) { try { localStorage.setItem("piscina-" + chave, JSON.stringify(valor)); } catch (e) {} }
function ler(chave, padrao) { try { const v = localStorage.getItem("piscina-" + chave); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; } }
const reduzirMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let animacoesPausadas = ler("pausar", reduzirMovimento);
const desenhadores = [];
function desenharTudo() { desenhadores.forEach((f) => f()); }

/* ---------------------------------------------------------
   1) IMAGENS
   Cada <img data-imagem="imagem1"> procura "imagens/imagem1.jpg"
   (ou .jpeg/.png/.webp) e também ao lado do index.html.
   --------------------------------------------------------- */
const EXTENSOES = ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG", "WEBP"];
$$("img[data-imagem]").forEach((img) => {
  const nome = img.dataset.imagem;
  const figura = img.closest("figure");
  const vaga = document.createElement("div");
  vaga.className = "vaga-imagem";
  vaga.setAttribute("aria-hidden", "true");
  vaga.innerHTML =
    '<span class="vaga-icone">📷</span>' +
    '<span class="vaga-nome">Imagem ' + nome.replace(/\D/g, "") + "</span>" +
    "<span>" + (img.alt || "") + "</span>" +
    "<span>Coloque o arquivo <code>imagens/" + nome + ".jpg</code> (ou .png)</span>";
  figura.insertBefore(vaga, img);
  // Imagem já embutida no próprio arquivo (data:): só mostra
  if (img.getAttribute("src")) {
    if (img.complete && img.naturalWidth) figura.classList.add("carregada");
    else img.addEventListener("load", () => figura.classList.add("carregada"));
    return;
  }
  const caminhos = [];
  ["imagens/", ""].forEach((p) => EXTENSOES.forEach((e) => caminhos.push(p + nome + "." + e)));
  let i = 0;
  const proxima = () => { if (i < caminhos.length) img.src = caminhos[i++]; };
  img.addEventListener("error", proxima);
  img.addEventListener("load", () => figura.classList.add("carregada"));
  proxima();
});

/* ---------------------------------------------------------
   2) QUEM APRESENTA + FERRAMENTAS DE CADA SEÇÃO
   Para trocar a pessoa, mude data-apresentador="..." no HTML.
   --------------------------------------------------------- */
const CORES = { Amanda: "var(--amanda)", Beatriz: "var(--beatriz)", Daniel: "var(--daniel)", Rafaela: "var(--rafaela)", Todos: "var(--todos)" };
const slides = $$(".slide");

slides.forEach((secao) => {
  const quem = secao.dataset.apresentador || "Todos";
  secao.style.setProperty("--cor", CORES[quem] || "var(--todos)");

  const barra = document.createElement("div");
  barra.className = "ferramentas-secao";

  const selo = document.createElement("span");
  selo.className = "selo-apresentador";
  selo.textContent = quem === "Todos" ? "Apresentam: todos" : "Apresenta: " + quem;
  barra.appendChild(selo);

  const titulo = (secao.querySelector("h1, h2") || {}).textContent || "esta seção";
  const nomeCurto = titulo.replace(/\s+/g, " ").trim();

  const ouvir = document.createElement("button");
  ouvir.type = "button";
  ouvir.className = "botao-ferramenta botao-ouvir";
  ouvir.setAttribute("aria-pressed", "false");
  ouvir.innerHTML = '<span aria-hidden="true">🔊</span> Ouvir';
  ouvir.setAttribute("aria-label", "Ouvir em voz alta: " + nomeCurto);
  ouvir.addEventListener("click", () => alternarLeitura(secao, ouvir));
  barra.appendChild(ouvir);

  const libras = document.createElement("button");
  libras.type = "button";
  libras.className = "botao-ferramenta";
  libras.setAttribute("aria-expanded", "false");
  libras.innerHTML = '<span aria-hidden="true">🤟</span> Vídeo em Libras';
  libras.setAttribute("aria-label", "Vídeo em Libras: " + nomeCurto);
  const painel = document.createElement("div");
  painel.className = "painel-libras";
  painel.id = "libras-" + secao.id;
  painel.hidden = true;
  libras.setAttribute("aria-controls", painel.id);
  libras.addEventListener("click", () => {
    const abrir = painel.hidden;
    painel.hidden = !abrir;
    libras.setAttribute("aria-expanded", String(abrir));
    if (abrir && !painel.dataset.carregado) carregarLibras(secao.id, painel, nomeCurto);
  });
  barra.appendChild(libras);

  let alvo = secao.querySelector(".conteudo") || secao;
  if (alvo.classList.contains("duas-colunas")) alvo = alvo.firstElementChild;
  alvo.insertBefore(painel, alvo.firstChild);
  alvo.insertBefore(barra, painel);
});

/* ---------------------------------------------------------
   3) VÍDEOS EM LIBRAS (estrutura preparada)
   --------------------------------------------------------- */
function idYoutube(url) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function carregarLibras(id, painel, titulo) {
  painel.dataset.carregado = "1";
  const fonte = (VIDEOS_LIBRAS[id] || "").trim();
  const yt = fonte ? idYoutube(fonte) : null;
  if (yt) {
    painel.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + yt +
      '" title="Vídeo em Libras: ' + titulo + '" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
    return;
  }
  const arquivo = fonte || "videos/libras-" + id + ".mp4";
  const video = document.createElement("video");
  video.controls = true;
  video.preload = "metadata";
  video.setAttribute("aria-label", "Vídeo em Libras: " + titulo);
  video.src = arquivo;
  video.addEventListener("error", () => {
    painel.innerHTML =
      '<div class="vaga-libras" role="note"><strong>🤟 Vídeo em Libras desta seção (em produção)</strong>' +
      "<span>Espaço reservado para a interpretação em Libras de: " + titulo + ".</span>" +
      "<span>Para ativar, envie o vídeo como <code>" + arquivo + "</code> ou cole um link do YouTube no início do script.</span>" +
      "<span>Enquanto isso, use o botão do <strong>VLibras</strong> no lado direito da tela.</span></div>";
  });
  painel.appendChild(video);
}

/* ---------------------------------------------------------
   4) LEITURA EM VOZ ALTA (sintetizador do próprio navegador)
   --------------------------------------------------------- */
let botaoLendo = null;
function pararLeitura() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (botaoLendo) { botaoLendo.setAttribute("aria-pressed", "false"); botaoLendo.innerHTML = '<span aria-hidden="true">🔊</span> Ouvir'; }
  botaoLendo = null;
}
function alternarLeitura(secao, botao) {
  if (!("speechSynthesis" in window)) { anunciar("Seu navegador não tem leitura em voz alta."); return; }
  if (botaoLendo === botao) { pararLeitura(); return; }
  pararLeitura();
  const copia = secao.cloneNode(true);
  copia.querySelectorAll(".ferramentas-secao, .painel-libras, pre, canvas, .vaga-imagem, button, .botao-copiar, script, [aria-hidden='true']").forEach((n) => n.remove());
  const texto = copia.innerText || copia.textContent;
  const partes = texto.replace(/\s+/g, " ").match(/[^.!?:]+[.!?:]*/g) || [texto];
  const vozes = speechSynthesis.getVoices();
  const voz = vozes.find((v) => v.lang === "pt-BR") || vozes.find((v) => v.lang.startsWith("pt"));
  botaoLendo = botao;
  botao.setAttribute("aria-pressed", "true");
  botao.innerHTML = '<span aria-hidden="true">⏹</span> Parar';
  partes.forEach((p, i) => {
    const fala = new SpeechSynthesisUtterance(p.trim());
    fala.lang = "pt-BR";
    if (voz) fala.voice = voz;
    fala.rate = 1;
    if (i === partes.length - 1) fala.onend = () => { if (botaoLendo === botao) pararLeitura(); };
    speechSynthesis.speak(fala);
  });
}
if ("speechSynthesis" in window) speechSynthesis.getVoices();

/* Região "ao vivo" para avisos a leitores de tela */
const avisos = document.createElement("div");
avisos.className = "so-leitor";
avisos.setAttribute("aria-live", "polite");
document.body.appendChild(avisos);
function anunciar(t) { avisos.textContent = ""; setTimeout(() => (avisos.textContent = t), 50); }

/* ---------------------------------------------------------
   5) BARRA DE PROGRESSO E BOTÕES "COPIAR"
   --------------------------------------------------------- */
const barraLeitura = $("#progressoLeitura");
window.addEventListener("scroll", () => {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  barraLeitura.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + "%";
}, { passive: true });

$$(".botao-copiar").forEach((botao) => {
  botao.addEventListener("click", async () => {
    const texto = document.getElementById(botao.dataset.copiar).innerText;
    try { await navigator.clipboard.writeText(texto); botao.textContent = "Copiado ✓"; anunciar("Código copiado."); }
    catch (e) { botao.textContent = "Selecione e copie"; }
    setTimeout(() => (botao.textContent = "Copiar código"), 2000);
  });
});

/* ---------------------------------------------------------
   6) MENU PRINCIPAL
   --------------------------------------------------------- */
const botaoMenu = $("#botaoMenu");
const menuPainel = $("#menuPainel");
function fecharMenu(devolverFoco) {
  menuPainel.hidden = true;
  botaoMenu.setAttribute("aria-expanded", "false");
  if (devolverFoco) botaoMenu.focus();
}
function posicionarMenu() {
  menuPainel.style.top = Math.max(0, $(".topo").getBoundingClientRect().bottom) + "px";
  menuPainel.style.maxHeight = "calc(100vh - " + menuPainel.style.top + ")";
}
window.addEventListener("scroll", () => { if (!menuPainel.hidden) posicionarMenu(); }, { passive: true });
$("#atalhoMenu").addEventListener("click", (e) => { e.preventDefault(); if (menuPainel.hidden) botaoMenu.click(); else menuPainel.querySelector("a").focus(); });
botaoMenu.addEventListener("click", () => {
  const abrir = menuPainel.hidden;
  posicionarMenu();
  menuPainel.hidden = !abrir;
  botaoMenu.setAttribute("aria-expanded", String(abrir));
  if (abrir) { const l = menuPainel.querySelector("a"); if (l) l.focus(); }
});
menuPainel.addEventListener("click", (e) => { if (e.target.closest("a")) fecharMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menuPainel.hidden) fecharMenu(true); });
document.addEventListener("click", (e) => {
  if (!menuPainel.hidden && !menuPainel.contains(e.target) && !botaoMenu.contains(e.target) && !e.target.closest("#atalhoMenu")) fecharMenu(false);
});

/* Ao pular para uma seção pelo menu, leva o foco do teclado junto */
$$('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    const alvo = document.getElementById(link.getAttribute("href").slice(1));
    if (alvo && !apresentando) { alvo.setAttribute("tabindex", "-1"); setTimeout(() => alvo.focus({ preventScroll: true }), 300); }
  });
});

/* ---------------------------------------------------------
   7) PAINEL DE ACESSIBILIDADE
   --------------------------------------------------------- */
const botaoA11y = $("#botaoAcessibilidade");
const painelA11y = $("#painelAcessibilidade");
const guia = $("#guiaLeitura");
const MODOS = {
  contraste: "alto-contraste",
  escuro: "modo-escuro",
  dislexia: "fonte-dislexia",
  espacamento: "espacamento",
  links: "destacar-links",
  cursor: "cursor-grande",
  pausar: "sem-animacao",
};
const CHAVES = ["contraste", "escuro", "cinza", "dislexia", "espacamento", "links", "guia", "cursor"];
function aplicarModo(chave, ativo) {
  // alto contraste e modo escuro não funcionam juntos: ligar um desliga o outro
  if (ativo && chave === "contraste" && ler("escuro", false)) { aplicarModo("escuro", false); guardar("escuro", false); }
  if (ativo && chave === "escuro" && ler("contraste", false)) { aplicarModo("contraste", false); guardar("contraste", false); }
  if (MODOS[chave]) document.body.classList.toggle(MODOS[chave], ativo);
  if (chave === "cinza") document.documentElement.classList.toggle("tons-cinza", ativo);
  if (chave === "guia") guia.hidden = !ativo;
  if (chave === "pausar") animacoesPausadas = ativo;
  $$('[data-modo="' + chave + '"], [data-modo-rapido="' + chave + '"]').forEach((b) => b.setAttribute("aria-pressed", String(ativo)));
  desenharTudo();
}
CHAVES.forEach((k) => aplicarModo(k, ler(k, false)));
aplicarModo("pausar", animacoesPausadas);

/* Botões rápidos da barra do topo */
$$("[data-modo-rapido]").forEach((b) => {
  b.addEventListener("click", () => {
    const k = b.dataset.modoRapido;
    const ativo = b.getAttribute("aria-pressed") !== "true";
    aplicarModo(k, ativo);
    guardar(k, ativo);
    anunciar(b.textContent.trim() + (ativo ? " ativado" : " desativado"));
  });
});

$$(".opcao-a11y", painelA11y).forEach((b) => {
  b.addEventListener("click", () => {
    const k = b.dataset.modo;
    const ativo = b.getAttribute("aria-pressed") !== "true";
    aplicarModo(k, ativo);
    guardar(k, ativo);
    anunciar(b.querySelector(".op-nome").textContent + (ativo ? " ativado" : " desativado"));
  });
});

let escala = ler("escala", 1);
const saidaEscala = $("#saidaEscala");
function aplicarEscala(v) {
  escala = Math.min(2, Math.max(0.9, Math.round(v * 10) / 10));
  document.documentElement.style.setProperty("--escala-texto", escala);
  document.documentElement.classList.toggle("texto-grande", escala >= 1.5);
  setTimeout(desenharTudo, 50);
  saidaEscala.textContent = Math.round(escala * 100) + "%";
  guardar("escala", escala);
}
aplicarEscala(escala);
$("#textoMenor").addEventListener("click", () => { aplicarEscala(escala - 0.1); anunciar("Texto em " + Math.round(escala * 100) + "%"); });
$("#textoMaior").addEventListener("click", () => { aplicarEscala(escala + 0.1); anunciar("Texto em " + Math.round(escala * 100) + "%"); });
$("#textoNormal").addEventListener("click", () => { aplicarEscala(1); anunciar("Texto no tamanho normal"); });
$("#barraMenor").addEventListener("click", () => $("#textoMenor").click());
$("#barraMaior").addEventListener("click", () => $("#textoMaior").click());
$("#barraNormal").addEventListener("click", () => $("#textoNormal").click());
$("#restaurarA11y").addEventListener("click", () => {
  CHAVES.forEach((k) => { aplicarModo(k, false); guardar(k, false); });
  aplicarModo("pausar", reduzirMovimento); guardar("pausar", reduzirMovimento);
  aplicarEscala(1);
  anunciar("Configurações de acessibilidade restauradas.");
});

function abrirA11y() {
  painelA11y.hidden = false;
  botaoA11y.setAttribute("aria-expanded", "true");
  painelA11y.querySelector("button").focus();
}
function fecharA11y() {
  painelA11y.hidden = true;
  botaoA11y.setAttribute("aria-expanded", "false");
  botaoA11y.focus();
}
botaoA11y.addEventListener("click", () => (painelA11y.hidden ? abrirA11y() : fecharA11y()));
$("#fecharA11y").addEventListener("click", fecharA11y);
painelA11y.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { e.stopPropagation(); fecharA11y(); }
  if (e.key === "Tab") { // mantém o foco dentro do painel
    const focaveis = $$("button, a, input", painelA11y).filter((el) => !el.disabled);
    const primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  }
});
$$("[data-abrir-a11y]").forEach((el) => el.addEventListener("click", (e) => { e.preventDefault(); if (!menuPainel.hidden) fecharMenu(false); abrirA11y(); }));

/* Guia de leitura acompanha o mouse */
document.addEventListener("mousemove", (e) => { if (!guia.hidden) guia.style.top = e.clientY + "px"; }, { passive: true });
document.addEventListener("focusin", (e) => {
  if (guia.hidden) return;
  const r = e.target.getBoundingClientRect();
  guia.style.top = r.top + r.height / 2 + "px";
});

/* ---------------------------------------------------------
   8) SIMULADOR DA CALDEIRA (seção 11 — mesma lógica do Arduino)
   --------------------------------------------------------- */
(function () {
  const ALVO = 28.0, HISTERESE = 1.0;
  let ligada = true;
  const s = $("#tempSim"); if (!s) return;
  const t = $("#tempValor"), led = $("#ledSim"), est = $("#estadoSim");
  function atualizar() {
    const temp = parseFloat(s.value);
    if (temp < ALVO - HISTERESE) ligada = true;
    else if (temp > ALVO + HISTERESE) ligada = false;
    t.textContent = fmt(temp) + " °C";
    led.classList.toggle("aceso", ligada);
    est.textContent = ligada ? "Caldeira LIGADA" : "Caldeira DESLIGADA";
    s.setAttribute("aria-valuetext", fmt(temp) + " graus, caldeira " + (ligada ? "ligada" : "desligada"));
  }
  s.addEventListener("input", atualizar);
  atualizar();
})();

/* ---------------------------------------------------------
   9) CANVAS: utilidades e controle das animações
   --------------------------------------------------------- */
function prepararCanvas(c) {
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth, h = c.clientHeight;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  }
  const ctx = c.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}
const contraste = () => document.body.classList.contains("alto-contraste");
window.addEventListener("resize", desenharTudo);

/* Cor aproximada de um comprimento de onda visível (nm) */
function corDoComprimento(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm <= 750) { r = 1; }
  if (nm < 380) return "#b197fc";   // ultravioleta (representação)
  if (nm > 750) return "#e8590c";   // infravermelho (representação)
  return "rgb(" + Math.round(r * 255) + "," + Math.round(g * 255) + "," + Math.round(b * 255) + ")";
}
/* Versão mais clara da cor, para enxergar bem sobre o fundo escuro */
function corClara(nm) {
  const c = corDoComprimento(nm);
  if (c[0] === "#") return c;
  const [r, g, b] = c.match(/\d+/g).map(Number);
  const mix = (v) => Math.round(v + (255 - v) * 0.35);
  return "rgb(" + mix(r) + "," + mix(g) + "," + mix(b) + ")";
}

const H = 6.62607015e-34, C = 2.99792458e8, K = 1.380649e-23, SIGMA = 5.670374e-8, B_WIEN = 2.897771955e-3;
const eVdoComprimento = (nm) => 1239.84 / nm;

/* ---------------------------------------------------------
   10) SIMULADOR: ESPECTRO ELETROMAGNÉTICO (seção 13)
   --------------------------------------------------------- */
(function () {
  const s = $("#ondaSlider"); if (!s) return;
  const tela = $("#ondaTela");
  const LOG_MIN = -7, LOG_MAX = -3; // 100 nm a 1 mm
  let fase = 0, rodando = false;
  function lambda() { return Math.pow(10, LOG_MIN + (LOG_MAX - LOG_MIN) * (s.value / 1000)); }
  function textoLambda(m) {
    if (m < 1e-6) return fmtInt(m * 1e9) + " nm";
    if (m < 1e-3) return fmt(m * 1e6, m < 1e-5 ? 2 : 1) + " µm";
    return fmt(m * 1e3, 2) + " mm";
  }
  function regiao(nm) {
    if (nm < 380) return ["Ultravioleta", "os fótons dessa faixa têm muita energia. A atmosfera filtra boa parte deles, e o que chega queima a pele e desgasta os materiais ao redor da piscina, mas ajuda pouco a aquecer a água."];
    if (nm <= 750) return ["Luz visível", "essa luz é absorvida pela placa escura do coletor e vira calor. Nas placas fotovoltaicas, os mesmos fótons liberam elétrons no silício e geram eletricidade."];
    if (nm <= 1107) return ["Infravermelho próximo", "uma grande parte da energia do Sol que aquece o coletor chega nessa faixa. As placas de silício ainda conseguem aproveitar esses fótons, até cerca de 1.100 nm."];
    if (nm <= 3000) return ["Infravermelho próximo", "essa radiação ainda aquece o coletor e a água, mas os fótons já não têm energia suficiente para gerar eletricidade no silício."];
    return ["Infravermelho térmico", "é nessa faixa que a própria piscina emite calor, com pico perto de 10 µm a 26 °C. À noite é por aqui que ela perde energia para o céu, e é por isso que usamos a manta térmica."];
  }
  function atualizar() {
    const m = lambda(), nm = m * 1e9;
    const f = C / m, e = eVdoComprimento(nm);
    const [nome, projeto] = regiao(nm);
    $("#ondaLambda").textContent = textoLambda(m);
    $("#ondaRegiao").textContent = nome;
    $("#ondaFreq").textContent = f.toExponential(2).replace(".", ",").replace("e+", " × 10^") + " Hz";
    $("#ondaEnergia").textContent = (e >= 0.1 ? fmt(e, 2) : fmt(e, 3)) + " eV";
    $("#ondaProjeto").textContent = projeto;
    $("#ondaMarcador").style.left = (s.value / 10) + "%";
    s.setAttribute("aria-valuetext", textoLambda(m) + ", " + nome);
    desenhar();
  }
  function desenhar() {
    const { ctx, w, h } = prepararCanvas(tela);
    const nm = lambda() * 1e9;
    ctx.fillStyle = contraste() ? "#000" : "#0d1b2a";
    ctx.fillRect(0, 0, w, h);
    // eixo
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    // onda: comprimento em pixels cresce com λ (escala ilustrativa)
    const pxLambda = 18 + (s.value / 1000) * 260;
    const amp = h * 0.32;
    ctx.strokeStyle = contraste() ? "#ffff00" : corClara(nm);
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const y = h / 2 - amp * Math.sin((2 * Math.PI * x) / pxLambda - fase);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    // régua de um comprimento de onda
    ctx.strokeStyle = "#fff"; ctx.fillStyle = "#fff"; ctx.lineWidth = 1.5;
    const x0 = 20, y0 = h - 22;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + pxLambda, y0);
    ctx.moveTo(x0, y0 - 6); ctx.lineTo(x0, y0 + 6); ctx.moveTo(x0 + pxLambda, y0 - 6); ctx.lineTo(x0 + pxLambda, y0 + 6); ctx.stroke();
    ctx.font = "600 14px 'Source Sans 3', sans-serif";
    ctx.fillText("λ (fora de escala)", x0 + pxLambda + 8, y0 + 5);
  }
  function animar() {
    if (!animacoesPausadas && visivel) { fase += 0.08; desenhar(); }
    requestAnimationFrame(animar);
  }
  let visivel = false;
  new IntersectionObserver((ent) => { visivel = ent[0].isIntersecting; }).observe(tela);
  s.addEventListener("input", atualizar);
  $$("[data-onda]").forEach((b) => b.addEventListener("click", () => {
    const nm = parseFloat(b.dataset.onda);
    s.value = Math.round(((Math.log10(nm * 1e-9) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 1000);
    atualizar();
  }));
  desenhadores.push(desenhar);
  atualizar();
  requestAnimationFrame(animar);
})();

/* ---------------------------------------------------------
   11) SIMULADOR: RADIAÇÃO DO CORPO NEGRO — curva de Planck (seção 14)
   --------------------------------------------------------- */
(function () {
  const s = $("#planckSlider"); if (!s) return;
  const tela = $("#planckTela");
  const T_SOL = 5772;
  const planck = (lm, T) => (2 * H * C * C) / Math.pow(lm, 5) / (Math.exp((H * C) / (lm * K * T)) - 1);
  const X_MIN = Math.log10(0.1e-6), X_MAX = Math.log10(100e-6); // 0,1 µm a 100 µm

  function curva(T) {
    const pico = planck(B_WIEN / T, T);
    const pts = [];
    for (let i = 0; i <= 400; i++) {
      const lx = X_MIN + (X_MAX - X_MIN) * (i / 400);
      pts.push([i / 400, planck(Math.pow(10, lx), T) / pico]);
    }
    return pts;
  }
  function desenhar() {
    const T = parseFloat(s.value);
    const { ctx, w, h } = prepararCanvas(tela);
    const hc = contraste();
    const esc = document.body.classList.contains("modo-escuro");
    const m = { e: 46, d: 14, t: 18, b: 40 };
    const pw = w - m.e - m.d, ph = h - m.t - m.b;
    ctx.fillStyle = hc ? "#000" : esc ? "#1b2733" : "#fff"; ctx.fillRect(0, 0, w, h);
    const xPos = (lm) => m.e + ((Math.log10(lm) - X_MIN) / (X_MAX - X_MIN)) * pw;
    // faixas UV / visível / IV
    const xUV = xPos(380e-9), xVis = xPos(750e-9);
    ctx.fillStyle = hc ? "#222" : esc ? "#252a45" : "#f3f0ff"; ctx.fillRect(m.e, m.t, xUV - m.e, ph);
    const grad = ctx.createLinearGradient(xUV, 0, xVis, 0);
    ["#7048e8", "#1c7ed6", "#37b24d", "#fab005", "#f76707", "#e03131"].forEach((c, i, a) => grad.addColorStop(i / (a.length - 1), c));
    ctx.globalAlpha = 0.22; ctx.fillStyle = grad; ctx.fillRect(xUV, m.t, xVis - xUV, ph); ctx.globalAlpha = 1;
    ctx.fillStyle = hc ? "#111" : esc ? "#2b2418" : "#fff4e6"; ctx.fillRect(xVis, m.t, m.e + pw - xVis, ph);
    // rótulos das faixas
    const corTexto = hc || esc ? "#fff" : "#4a5a66";
    ctx.fillStyle = corTexto; ctx.font = "600 12px 'Source Sans 3', sans-serif"; ctx.textAlign = "center";
    ctx.fillText("UV", (m.e + xUV) / 2, m.t + 14);
    ctx.fillText("visível", (xUV + xVis) / 2, m.t + 14);
    ctx.fillText("infravermelho", (xVis + m.e + pw) / 2, m.t + 14);
    // grade e eixo x
    ctx.strokeStyle = hc ? "#666" : esc ? "#34465a" : "#e9ecef"; ctx.lineWidth = 1;
    ctx.fillStyle = corTexto;
    [[0.1e-6, "0,1 µm"], [1e-6, "1 µm"], [10e-6, "10 µm"], [100e-6, "100 µm"]].forEach(([lm, rot]) => {
      const x = xPos(lm);
      ctx.beginPath(); ctx.moveTo(x, m.t); ctx.lineTo(x, m.t + ph); ctx.stroke();
      ctx.textAlign = lm === 0.1e-6 ? "left" : lm === 100e-6 ? "right" : "center";
      ctx.fillText(rot, x, h - m.b + 18);
    });
    ctx.textAlign = "center";
    ctx.fillText("comprimento de onda (escala logarítmica)", m.e + pw / 2, h - 6);
    ctx.save(); ctx.translate(14, m.t + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("intensidade relativa", 0, 0); ctx.restore();
    ctx.strokeStyle = hc || esc ? "#fff" : "#adb5bd";
    ctx.beginPath(); ctx.moveTo(m.e, m.t + ph); ctx.lineTo(m.e + pw, m.t + ph); ctx.stroke();

    function tracar(T2, cor, tracejado) {
      const pts = curva(T2);
      ctx.strokeStyle = cor; ctx.lineWidth = 2.5; ctx.setLineDash(tracejado ? [7, 5] : []);
      ctx.beginPath();
      pts.forEach(([fx, fy], i) => {
        const x = m.e + fx * pw, y = m.t + ph - fy * (ph - 22);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke(); ctx.setLineDash([]);
    }
    if (Math.abs(T - T_SOL) > 30) tracar(T_SOL, hc || esc ? "#ffa94d" : "#d9480f", true);
    tracar(T, hc ? "#ffff00" : esc ? "#74c0fc" : "#1971c2", false);
    // pico (lei de Wien)
    const lmax = B_WIEN / T, xp = xPos(lmax);
    if (xp > m.e && xp < m.e + pw) {
      ctx.strokeStyle = hc ? "#ffff00" : esc ? "#fff" : "#1d2a33"; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(xp, m.t + 22); ctx.lineTo(xp, m.t + ph); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = hc ? "#ffff00" : esc ? "#fff" : "#1d2a33"; ctx.font = "700 13px 'Source Sans 3', sans-serif";
      ctx.textAlign = xp > m.e + pw - 90 ? "right" : "left";
      ctx.fillText("pico (Wien)", xp + (ctx.textAlign === "left" ? 5 : -5), m.t + 34);
    }
  }
  function textoLambda(lm) { return lm < 1e-6 ? fmtInt(lm * 1e9) + " nm" : fmt(lm * 1e6, 1) + " µm"; }
  function atualizar() {
    const T = parseFloat(s.value);
    const lmax = B_WIEN / T;
    const pot = SIGMA * Math.pow(T, 4);
    $("#planckT").textContent = fmtInt(T) + " K (" + fmtInt(T - 273.15) + " °C)";
    $("#planckPico").textContent = textoLambda(lmax);
    const nm = lmax * 1e9;
    $("#planckFaixa").textContent = nm < 380 ? "ultravioleta" : nm <= 750 ? "luz visível" : "infravermelho";
    $("#planckPot").textContent = pot >= 1e6 ? fmt(pot / 1e6, 1) + " MW/m²" : pot >= 1e3 ? fmt(pot / 1e3, 1) + " kW/m²" : fmtInt(pot) + " W/m²";
    s.setAttribute("aria-valuetext", fmtInt(T) + " kelvin, pico em " + textoLambda(lmax));
    $$("[data-temp]").forEach((b) => b.setAttribute("aria-pressed", String(Math.abs(parseFloat(b.dataset.temp) - T) < 1)));
    desenhar();
  }
  s.addEventListener("input", atualizar);
  $$("[data-temp]").forEach((b) => b.addEventListener("click", () => { s.value = b.dataset.temp; atualizar(); }));
  desenhadores.push(desenhar);
  atualizar();
})();

/* ---------------------------------------------------------
   12) CALCULADORA: perda de calor da piscina à noite por radiação
   --------------------------------------------------------- */
(function () {
  const ids = ["noiteAgua", "noiteCeu", "noiteArea", "noiteHoras"];
  if (!$("#noiteAgua")) return;
  const EMISSIVIDADE = 0.95, PROFUNDIDADE = 1.5;
  function atualizar() {
    const tA = parseFloat($("#noiteAgua").value), tC = parseFloat($("#noiteCeu").value);
    const area = parseFloat($("#noiteArea").value), horas = parseFloat($("#noiteHoras").value);
    $("#noiteAguaV").textContent = fmt(tA) + " °C";
    $("#noiteCeuV").textContent = fmt(tC) + " °C";
    $("#noiteAreaV").textContent = fmtInt(area) + " m²";
    $("#noiteHorasV").textContent = fmtInt(horas) + " h";
    const TA = tA + 273.15, TC = tC + 273.15;
    const porM2 = EMISSIVIDADE * SIGMA * (Math.pow(TA, 4) - Math.pow(TC, 4));
    const totalkW = (porM2 * area) / 1000;
    const kWh = totalkW * horas;
    const volume = area * PROFUNDIDADE;
    const queda = kWh / (volume * 1.16);
    $("#noitePorM2").textContent = fmtInt(porM2) + " W/m²";
    $("#noiteTotal").textContent = fmt(totalkW, 1) + " kW";
    $("#noiteEnergia").textContent = fmtInt(kWh) + " kWh";
    $("#noiteQueda").textContent = fmt(queda, 2) + " °C";
    $("#noiteVolume").textContent = fmtInt(volume);
  }
  ids.forEach((id) => $("#" + id).addEventListener("input", atualizar));
  atualizar();
})();

/* ---------------------------------------------------------
   13) SIMULADOR: EFEITO FOTOELÉTRICO x FOTOVOLTAICO (seção 15)
   --------------------------------------------------------- */
(function () {
  const sL = $("#fotoLambda"); if (!sL) return;
  const sI = $("#fotoIntensidade"), sel = $("#fotoMaterial"), tela = $("#fotoTela");
  const MATERIAIS = {
    sodio: { nome: "Sódio (metal)", limiar: 2.28, tipo: "foto" },
    zinco: { nome: "Zinco (metal)", limiar: 4.3, tipo: "foto" },
    silicio: { nome: "Silício (célula solar)", limiar: 1.12, tipo: "pv" },
  };
  let fotons = [], eletrons = [], contador = 0, corrente = 0, visivel = false;

  function estado() {
    const nm = parseFloat(sL.value), mat = MATERIAIS[sel.value];
    const E = eVdoComprimento(nm);
    return { nm, E, mat, sobra: E - mat.limiar, intensidade: parseFloat(sI.value) };
  }
  function atualizar() {
    const st = estado();
    $("#fotoLambdaV").textContent = fmtInt(st.nm) + " nm";
    $("#fotoIntV").textContent = fmtInt(st.intensidade) + "%";
    $("#fotoEnergia").textContent = fmt(st.E, 2) + " eV";
    $("#fotoLimiar").textContent = fmt(st.mat.limiar, 2) + " eV";
    $("#fotoLimiarRot").textContent = st.mat.tipo === "pv" ? "Energia mínima (gap do silício)" : "Função trabalho (φ)";
    const lmax = 1239.84 / st.mat.limiar;
    $("#fotoCorte").textContent = fmtInt(lmax) + " nm";
    let msg;
    if (st.sobra <= 0) {
      $("#fotoEc").textContent = "nenhum elétron";
      msg = "O fóton não tem energia suficiente, então nenhum elétron é liberado, por mais que você aumente a intensidade. Foi exatamente isso que Einstein explicou: o que importa é a frequência da luz (a cor), e não o brilho.";
    } else if (st.mat.tipo === "pv") {
      $("#fotoEc").textContent = "elétron livre no silício";
      msg = "Esse é o efeito fotovoltaico. O fóton libera o elétron dentro do silício, e o campo elétrico da célula empurra esse elétron pelo fio. É essa corrente que alimenta a bomba. Com mais intensidade chegam mais fótons e a corrente aumenta.";
    } else {
      $("#fotoEc").textContent = fmt(st.sobra, 2) + " eV";
      msg = "Esse é o efeito fotoelétrico. Cada fóton arranca um elétron do metal, e a energia que sobra (h·f − φ) vira a energia de movimento do elétron. Aumentar a intensidade solta mais elétrons, mas não deixa nenhum deles mais rápido.";
    }
    $("#fotoMsg").textContent = msg;
    sL.setAttribute("aria-valuetext", fmtInt(st.nm) + " nanômetros, " + fmt(st.E, 2) + " elétron-volts");
    if (animacoesPausadas || !visivel) desenhar(true);
  }
  function desenhar(estatico) {
    const { ctx, w, h } = prepararCanvas(tela);
    const st = estado(), hc = contraste();
    ctx.fillStyle = hc ? "#000" : "#0d1b2a"; ctx.fillRect(0, 0, w, h);
    const corF = hc ? "#ffff00" : corClara(st.nm);
    // lâmpada
    const lx = 40, ly = h / 2;
    ctx.fillStyle = corF; ctx.globalAlpha = 0.25 + 0.6 * (st.intensidade / 100);
    ctx.beginPath(); ctx.arc(lx, ly, 26, 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff"; ctx.font = "600 13px 'Source Sans 3', sans-serif"; ctx.textAlign = "center";
    ctx.fillText("luz", lx, ly + 46);
    // placa
    const px = w * 0.62, pw = 26;
    ctx.fillStyle = st.mat.tipo === "pv" ? "#1c3d6e" : "#868e96";
    ctx.fillRect(px, 30, pw, h - 60);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.strokeRect(px, 30, pw, h - 60);
    ctx.fillStyle = "#fff"; ctx.fillText(st.mat.tipo === "pv" ? "silício" : "metal", px + pw / 2, 22);
    if (st.mat.tipo === "pv") { // fio e medidor de corrente
      ctx.strokeStyle = "#ced4da"; ctx.beginPath();
      ctx.moveTo(px + pw / 2, h - 30); ctx.lineTo(px + pw / 2, h - 12); ctx.lineTo(w - 50, h - 12); ctx.lineTo(w - 50, h / 2 + 30); ctx.stroke();
      ctx.fillStyle = "#212529"; ctx.fillRect(w - 80, h / 2 - 30, 60, 60); ctx.strokeRect(w - 80, h / 2 - 30, 60, 60);
      const brilho = Math.min(1, corrente / 6);
      ctx.fillStyle = "rgba(255, 212, 59," + (0.15 + 0.85 * brilho) + ")";
      ctx.beginPath(); ctx.arc(w - 50, h / 2 - 2, 16, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText("bomba", w - 50, h / 2 + 44);
    }
    // fótons
    ctx.fillStyle = corF;
    fotons.forEach((f) => { ctx.beginPath(); ctx.arc(f.x, f.y, 4, 0, 2 * Math.PI); ctx.fill(); });
    // elétrons
    ctx.fillStyle = hc ? "#fff" : "#74c0fc";
    eletrons.forEach((e) => { ctx.beginPath(); ctx.arc(e.x, e.y, 4.5, 0, 2 * Math.PI); ctx.fill(); });
    if (estatico) { // desenho parado: setas indicando o que acontece
      ctx.strokeStyle = corF; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { const y = 60 + i * ((h - 120) / 3); ctx.beginPath(); ctx.moveTo(lx + 34, y); ctx.lineTo(px - 8, y); ctx.stroke(); }
      if (st.sobra > 0) {
        ctx.fillStyle = hc ? "#fff" : "#74c0fc";
        for (let i = 0; i < 3; i++) { const y = 70 + i * ((h - 140) / 2); ctx.beginPath(); ctx.arc(st.mat.tipo === "pv" ? px + pw / 2 : px + pw + 30 + i * 12, st.mat.tipo === "pv" ? y : y, 5, 0, 2 * Math.PI); ctx.fill(); }
      }
    }
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.font = "700 14px 'Source Sans 3', sans-serif";
    ctx.fillText(st.sobra > 0 ? "elétrons liberados ✓" : "nenhum elétron ✗", 12, 22);
  }
  function passo() {
    if (!animacoesPausadas && visivel) {
      const st = estado(), { w, h } = { w: tela.clientWidth, h: tela.clientHeight };
      const px = w * 0.62, pw = 26;
      contador += st.intensidade / 100;
      while (contador >= 1) { contador -= 1; fotons.push({ x: 70, y: 40 + Math.random() * (h - 80) }); }
      fotons.forEach((f) => (f.x += 6));
      fotons = fotons.filter((f) => {
        if (f.x < px) return true;
        if (st.sobra > 0) {
          if (st.mat.tipo === "pv") eletrons.push({ x: px + pw / 2, y: f.y, vx: 0, vy: 3 });
          else { const v = 1.5 + 3 * Math.sqrt(st.sobra); eletrons.push({ x: px + pw + 2, y: f.y, vx: v, vy: (Math.random() - 0.5) * v }); }
        }
        return false;
      });
      let chegaram = 0;
      eletrons.forEach((e) => { e.x += e.vx; e.y += e.vy; });
      eletrons = eletrons.filter((e) => {
        if (st.mat.tipo === "pv") { if (e.y > h - 32) { chegaram++; return false; } return e.x > px; }
        return e.x < w + 10 && e.y > -10 && e.y < h + 10;
      });
      corrente = corrente * 0.95 + chegaram;
      desenhar(false);
    }
    requestAnimationFrame(passo);
  }
  new IntersectionObserver((ent) => { visivel = ent[0].isIntersecting; if (!visivel) desenhar(true); }).observe(tela);
  [sL, sI].forEach((el) => el.addEventListener("input", atualizar));
  sel.addEventListener("change", () => { eletrons = []; atualizar(); });
  desenhadores.push(() => desenhar(true));
  atualizar();
  desenhar(true);
  requestAnimationFrame(passo);
})();

/* ---------------------------------------------------------
   14) SIMULADOR: AUTOMAÇÃO COM SENSORES (seção 16)
   Mesma lógica do código Arduino da seção.
   --------------------------------------------------------- */
(function () {
  const sLuz = $("#autoLuz"); if (!sLuz) return;
  const sAgua = $("#autoAgua"), sCol = $("#autoColetor"), chkUso = $("#autoUso");
  const ALVO = 28, HIST = 1, DIF_LIGA = 4, DIF_DESLIGA = 1.5, LUZ_FORTE = 60, LUZ_NOITE = 15;
  let bomba = false, caldeira = false;
  function led(id, ligado, txtLigado, txtDesligado) {
    $("#" + id + " .led").classList.toggle("aceso", ligado);
    $("#" + id + " .estado").textContent = ligado ? txtLigado : txtDesligado;
  }
  function atualizar() {
    const luz = parseFloat(sLuz.value), agua = parseFloat(sAgua.value), col = parseFloat(sCol.value), uso = chkUso.checked;
    $("#autoLuzV").textContent = fmtInt(luz) + "%";
    $("#autoAguaV").textContent = fmt(agua) + " °C";
    $("#autoColetorV").textContent = fmt(col) + " °C";
    // 1) bomba solar: controle diferencial
    if (col > agua + DIF_LIGA) bomba = true; else if (col < agua + DIF_DESLIGA) bomba = false;
    // 2) caldeira: com sol forte, deixa o Sol terminar o serviço
    const solForte = luz > LUZ_FORTE;
    const limLiga = solForte ? ALVO - 3 : ALVO - HIST;
    const limDesliga = solForte ? ALVO - 2 : ALVO + HIST;
    if (agua < limLiga) caldeira = true; else if (agua > limDesliga) caldeira = false;
    // 3) aviso de manta
    const noite = luz < LUZ_NOITE;
    const manta = noite && !uso;
    led("ledBomba", bomba, "LIGADA", "desligada");
    led("ledCaldeira", caldeira, "LIGADA", "desligada");
    led("ledManta", manta, "COBRIR!", "sem aviso");
    const dif = col - agua;
    $("#autoExplica").innerHTML =
      "<li><strong>Bomba solar " + (bomba ? "ligada" : "desligada") + ".</strong> O coletor está " + fmt(Math.abs(dif)) + " °C " + (dif >= 0 ? "mais quente" : "mais frio") + " que a água. " +
      (bomba ? "Vale a pena fazer a água passar por ele." : "Circular a água agora não traria calor; a bomba só liga quando a diferença passa de 4 °C.") + "</li>" +
      "<li><strong>Caldeira " + (caldeira ? "ligada" : "desligada") + ".</strong> " + (solForte ? "Como há sol forte, ela só liga abaixo de 25 °C e desliga em 26 °C." : "Como há pouco sol, ela liga abaixo de 27 °C e desliga acima de 29 °C.") + "</li>" +
      "<li><strong>Manta.</strong> " + (manta ? "Está escuro e a piscina não está sendo usada, então é hora de cobrir para guardar o calor." : noite ? "Já escureceu, mas a piscina ainda está sendo usada." : "Ainda há luz, então não há aviso.") + "</li>";
    [sLuz, sAgua, sCol].forEach((el) => el.setAttribute("aria-valuetext", el.parentElement.querySelector("output").textContent));
  }
  [sLuz, sAgua, sCol].forEach((el) => el.addEventListener("input", atualizar));
  chkUso.addEventListener("change", atualizar);
  $$("[data-cenario]").forEach((b) => b.addEventListener("click", () => {
    const [l, a, c, u] = b.dataset.cenario.split(",");
    sLuz.value = l; sAgua.value = a; sCol.value = c; chkUso.checked = u === "1";
    atualizar(); anunciar("Cenário: " + b.textContent);
  }));
  atualizar();
})();

/* ---------------------------------------------------------
   15) CALCULADORA: custo de aquecer e economia com o Sol (seção 17)
   --------------------------------------------------------- */
(function () {
  if (!$("#custoVolume")) return;
  function atualizar() {
    const v = parseFloat($("#custoVolume").value), dt = parseFloat($("#custoDelta").value);
    const tarifa = Math.max(0, parseFloat(String($("#custoTarifa").value).replace(",", ".")) || 0);
    const frac = parseFloat($("#custoSolar").value) / 100;
    $("#custoVolumeV").textContent = fmtInt(v) + " m³";
    $("#custoDeltaV").textContent = fmt(dt) + " °C";
    $("#custoSolarV").textContent = fmtInt(frac * 100) + "%";
    const kWh = v * dt * 1.16;
    const total = kWh * tarifa, comSol = total * (1 - frac);
    $("#custoEnergia").textContent = fmtInt(kWh) + " kWh";
    $("#custoTotal").textContent = "R$ " + fmt(total, 2);
    $("#custoComSol").textContent = "R$ " + fmt(comSol, 2);
    $("#custoEconomia").textContent = "R$ " + fmt(total - comSol, 2);
    $("#barraComprada").style.width = "100%";
    $("#barraSolar").style.width = (total > 0 ? (comSol / total) * 100 : 0) + "%";
    $("#barraCompradaV").textContent = "R$ " + fmt(total, 2);
    $("#barraSolarV").textContent = "R$ " + fmt(comSol, 2);
  }
  ["custoVolume", "custoDelta", "custoTarifa", "custoSolar"].forEach((id) => $("#" + id).addEventListener("input", atualizar));
  atualizar();
})();

/* ---------------------------------------------------------
   16) CONTRASTE VALIDADO (WCAG 2.1) — calculado ao vivo
   --------------------------------------------------------- */
(function () {
  const corpo = $("#tabelaContraste"); if (!corpo) return;
  const PARES = [
    ["Texto principal sobre o fundo", "#1d2a33", "#fffaf1"],
    ["Texto secundário sobre o fundo", "#4a5a66", "#fffaf1"],
    ["Links (azul-água) sobre o fundo", "#0b7285", "#fffaf1"],
    ["Título laranja sobre o fundo", "#a35200", "#fffaf1"],
    ["Texto sobre o número laranja das seções", "#1d2a33", "#f59f00"],
    ["Branco sobre o selo da Amanda", "#ffffff", "#c2410c"],
    ["Branco sobre o selo da Beatriz", "#ffffff", "#1971c2"],
    ["Branco sobre o selo do Daniel", "#ffffff", "#237a35"],
    ["Branco sobre o selo da Rafaela", "#ffffff", "#9c36b5"],
    ["Amarelo sobre o azul-noite (capa)", "#ffd43b", "#0d1b2a"],
    ["Branco sobre o azul-noite (capa)", "#ffffff", "#123248"],
    ["Alto contraste: amarelo sobre preto", "#ffff00", "#000000"],
  ];
  function lum(hex) {
    const c = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255)
      .map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  const razao = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  corpo.innerHTML = PARES.map(([nome, frente, fundo]) => {
    const r = razao(frente, fundo);
    const aa = r >= 4.5, aaa = r >= 7;
    return '<tr><th scope="row"><span aria-hidden="true" style="display:inline-block;width:1.6em;height:1.2em;border-radius:4px;vertical-align:middle;margin-right:.4em;background:' + fundo + ";color:" + frente + ';text-align:center;font-weight:700;line-height:1.2em;border:1px solid #ccc">A</span>' + nome + "</th>" +
      "<td>" + fmt(r, 2) + " : 1</td>" +
      '<td class="' + (aa ? "passa" : "falha") + '">' + (aa ? "✓ passa" : "✗ não passa") + "</td>" +
      '<td class="' + (aaa ? "passa" : "") + '">' + (aaa ? "✓ passa" : "—") + "</td></tr>";
  }).join("");
})();

/* ---------------------------------------------------------
   17) MODO APRESENTAÇÃO
   Teclas: → ou Espaço = próximo · ← = anterior · F = tela cheia · Esc = sair
   --------------------------------------------------------- */
const botaoApresentar = $("#botaoApresentar");
const controles = $("#controles");
const quemEl = $("#controlesQuem"), contadorEl = $("#controlesContador"), barraEl = $("#controlesBarra");
let atual = 0, apresentando = false;

function mostrarSlide(i) {
  atual = Math.max(0, Math.min(slides.length - 1, i));
  slides.forEach((s, n) => s.classList.toggle("ativo", n === atual));
  const s = slides[atual];
  s.scrollTop = 0;
  pararLeitura();
  const quem = s.dataset.apresentador || "Todos";
  quemEl.textContent = quem;
  controles.style.setProperty("--cor", CORES[quem] || "var(--todos)");
  contadorEl.textContent = atual + 1 + " / " + slides.length;
  barraEl.style.width = ((atual + 1) / slides.length) * 100 + "%";
  history.replaceState(null, "", "#" + s.id);
  const titulo = s.querySelector("h1, h2");
  anunciar("Slide " + (atual + 1) + " de " + slides.length + ": " + (titulo ? titulo.textContent.trim() : "") + ". Apresenta " + quem + ".");
  setTimeout(desenharTudo, 50);
}
function iniciarApresentacao() {
  const indice = slides.findIndex((s) => s.id === location.hash.slice(1));
  apresentando = true;
  document.body.classList.add("modo-apresentacao");
  controles.hidden = false;
  mostrarSlide(indice >= 0 ? indice : 0);
  $("#btnProximo").focus();
}
function sairApresentacao() {
  apresentando = false;
  document.body.classList.remove("modo-apresentacao");
  controles.hidden = true;
  slides.forEach((s) => s.classList.remove("ativo"));
  if (document.fullscreenElement) document.exitFullscreen();
  slides[atual].scrollIntoView();
  botaoApresentar.focus();
  setTimeout(desenharTudo, 50);
}
function alternarTelaCheia() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  } catch (e) {}
}
botaoApresentar.addEventListener("click", iniciarApresentacao);
$("#btnProximo").addEventListener("click", () => mostrarSlide(atual + 1));
$("#btnAnterior").addEventListener("click", () => mostrarSlide(atual - 1));
$("#btnSair").addEventListener("click", sairApresentacao);
$("#btnTelaCheia").addEventListener("click", alternarTelaCheia);

$$('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    if (!apresentando) return;
    const i = slides.findIndex((s) => "#" + s.id === link.getAttribute("href"));
    if (i >= 0) { e.preventDefault(); mostrarSlide(i); }
  });
});

document.addEventListener("keydown", (e) => {
  if (!apresentando || e.altKey || e.ctrlKey || e.metaKey) return;
  if (!painelA11y.hidden) return;
  const el = e.target;
  if (el.matches("input, textarea, select")) return; // não atrapalha os simuladores
  const botaoFocado = el.matches("button, a, summary");
  if (["ArrowRight", "PageDown"].includes(e.key) || (e.key === " " && !botaoFocado)) { e.preventDefault(); mostrarSlide(atual + 1); }
  else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); mostrarSlide(atual - 1); }
  else if (e.key === "Home") mostrarSlide(0);
  else if (e.key === "End") mostrarSlide(slides.length - 1);
  else if (e.key.toLowerCase() === "f") alternarTelaCheia();
  else if (e.key === "Escape") sairApresentacao();
});

/* ---------------------------------------------------------
   18) TABELAS COM ROLAGEM acessíveis pelo teclado
   --------------------------------------------------------- */
$$(".tabela-rolagem").forEach((t, i) => {
  t.setAttribute("tabindex", "0");
  t.setAttribute("role", "region");
  const cap = t.querySelector("caption");
  t.setAttribute("aria-label", cap ? cap.textContent : "Tabela " + (i + 1) + " (role para os lados se precisar)");
});

/* ---------------------------------------------------------
   19) ATALHOS ALT + 1, 2, 3, 4 (padrão eMAG) — funcionam em
   qualquer navegador, mesmo sem suporte a accesskey
   --------------------------------------------------------- */
document.addEventListener("keydown", (e) => {
  if (!e.altKey || e.ctrlKey || e.metaKey) return;
  const tecla = e.code ? e.code.replace("Digit", "").replace("Numpad", "") : e.key;
  if (!["1", "2", "3", "4"].includes(tecla)) return;
  e.preventDefault();
  if (apresentando) sairApresentacao();
  if (tecla === "1") { const m = $("#conteudo"); m.scrollIntoView(); m.focus({ preventScroll: true }); anunciar("Conteúdo principal"); }
  if (tecla === "2") { if (menuPainel.hidden) botaoMenu.click(); else menuPainel.querySelector("a").focus(); }
  if (tecla === "3") { if (painelA11y.hidden) abrirA11y(); else painelA11y.querySelector("button").focus(); }
  if (tecla === "4") { const r = $("#rodape"); r.scrollIntoView(); r.focus({ preventScroll: true }); anunciar("Rodapé"); }
});
