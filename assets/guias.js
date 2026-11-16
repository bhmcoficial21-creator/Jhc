// Conteúdo dos guias: 16 guias + 2 bônus (fonte: Kit de Construção)
const AVISO = "Não substitui avaliação médica ou fisioterapêutica. Dor forte, formigamento, perda de força ou dor após queda: procure um profissional.";
const ex = (nome, medida, desc, resp, foto) => ({ t: "ex", nome, medida, desc, resp, foto });
const capa = (titulo, tempo, para, foto) => ({ t: "capa", titulo, tempo, para, foto });
// lista simples: cada item vira um card
const lista = (zona, tempo, para, itens, resp) => [capa("Reset de " + zona, tempo, para), ...itens.map(i => ex(i[0], i[1], i[2], resp || "Respire devagar: solte o ar no esforço.", i[3] || "foto do movimento"))];

window.AVISO = AVISO;
window.MODULOS = [
 { id: 1, nome: "Módulo 1 — SOS Alívio Imediato", guias: [
  { id: "sos-pescoco-ombros", titulo: "SOS Pescoço e Ombros", tempo: "3 min", cards: [
    capa("Reset de Pescoço e Ombros", "3 minutos", "para quem passa horas olhando tela."),
    ex("Recolher o queixo", "10x", "Leve o queixo para trás, como se fizesse “papada”.", "Solte o ar ao voltar.", "foto: perfil"),
    ex("Inclinação lateral", "30 s cada lado", "Mão na lateral da cabeça, só o peso da mão, sem puxar. Deixe o ombro oposto descer.", "Respire fundo e devagar.", "foto: de frente, os dois lados"),
    ex("Rolar os ombros", "10x", "Círculos lentos para trás, abrindo o peito.", "Inspire subindo, solte descendo.", "foto: de frente"),
    ex("Juntar as escápulas", "10x, segura 3 s", "Aproxime as omoplatas, como se guardasse um lápis entre elas.", "Solte o ar ao relaxar.", "foto: de costas ou de lado")] },
  { id: "sos-punhos-antebracos", titulo: "SOS Punhos e Antebraços", tempo: "2 min", cards: [
    capa("Reset de Punhos e Antebraços", "2 minutos", "para quem digita, usa mouse ou repete movimento."),
    ex("Alongar o lado da palma", "30 s cada", "Braço esticado, palma para frente, outra mão puxa os dedos para você com suavidade.", "Respire sem prender o ar.", "foto: braço esticado"),
    ex("Alongar o lado de trás", "30 s cada", "Braço esticado, palma para baixo, outra mão leva os dedos para baixo.", "Respire sem prender o ar.", "foto: braço esticado, palma para baixo"),
    ex("Abrir e fechar a mão", "10x", "Devagar, sem forçar.", "Solte o ar ao abrir.", "foto: mão aberta e fechada"),
    ex("Círculos com o punho", "10x cada sentido", "Cotovelo apoiado, desenhe círculos amplos e lentos.", "Respire no ritmo do círculo.", "foto: punho em movimento")] },
  { id: "sos-lombar", titulo: "SOS Lombar", tempo: "3 min", cards: [
    capa("Reset da Lombar", "3 minutos", "para quem fica sentado, em pé ou carrega peso."),
    ex("Inclinar a pelve", "10x", "Sentado, vá para frente e para trás com a bacia, em movimento pequeno.", "Solte o ar ao ir para trás.", "foto: perfil sentado, as duas posições"),
    ex("Gato e camelo sentado", "8x", "Arredonde as costas soltando o ar, depois abra o peito puxando o ar.", "Solte o ar ao arredondar.", "foto: perfil, as duas posições"),
    ex("Extensão em pé", "5x", "Mãos na cintura, incline levemente o tronco para trás e volte.", "Solte o ar ao voltar.", "foto: perfil em pé"),
    ex("Joelhos ao peito (se puder deitar)", "30 s", "Deitado, abrace os joelhos e respire devagar.", "Respire fundo e devagar.", "foto: deitada de lado")] },
  { id: "sos-quadril-joelhos", titulo: "SOS Quadril e Joelhos", tempo: "3 min", cards: [
    capa("Reset de Quadril e Joelhos", "3 minutos", "para quem sente rigidez ao levantar ou subir escada.", "pessoa em pé"),
    ex("Alongar a frente do quadril", "30 s cada", "Posição de afundo, quadril para frente, tronco alto.", "Solte o ar ao ir à frente.", "foto: afundo, lado"),
    ex("Tornozelo sobre o joelho", "30 s cada", "Sentado, incline o tronco para frente até sentir o glúteo alongar.", "Respire fundo e devagar.", "foto: sentado, perfil"),
    ex("Ponte de glúteo", "10x", "Deitado, suba o quadril e aperte o glúteo no alto. Sem chão: contração do glúteo sentado, 10x, segura 5 s.", "Solte o ar ao subir.", "foto: ponte e versão sentada")] },
  { id: "sos-pes-calcanhares", titulo: "SOS Pés e Calcanhares", tempo: "2 min", cards: [
    capa("Reset dos Pés", "2 minutos", "para quem passa o dia em pé."),
    ex("Rolar a sola", "45 s cada pé", "Garrafinha ou bolinha, pressão confortável.", "Respire devagar.", "foto: pé sobre a garrafa"),
    ex("Alongar a panturrilha", "30 s cada", "Mãos na parede, uma perna atrás, calcanhar no chão.", "Respire sem prender o ar.", "foto: perfil na parede"),
    ex("Dedos para cima", "20 s cada", "Sentado, puxe os dedos do pé para você com a mão.", "Respire devagar.", "foto: pé apoiado no joelho")] } ] },
 { id: 2, nome: "Módulo 2 — Reprogramação de Hábitos Posturais", guias: [
  { id: "como-sentar", titulo: "Como sentar", tempo: "2 min", cards: lista("hábito: Como sentar", "2 min de leitura", "para quem trabalha sentado.", [["Pés no chão","","Mantenha os pés apoiados no chão."],["Quadril no fundo","","Encoste o quadril no fundo da cadeira."],["Apoio na lombar","","Pode ser uma toalha enrolada."]]) },
  { id: "mesa-e-tela", titulo: "Mesa e tela", tempo: "2 min", cards: lista("hábito: Mesa e tela", "2 min de leitura", "para quem usa computador.", [["Tela na altura dos olhos","","Solução caseira: livros ou caixa sob o monitor."],["Cotovelos a 90 graus","","Antebraços apoiados, ombros soltos."],["Mouse perto do corpo","","Evite esticar o braço."]]) },
  { id: "celular", titulo: "Celular sem “pescoço de texto”", tempo: "1 min", cards: lista("hábito: Celular", "1 min de leitura", "para quem vive no celular.", [["Suba o celular","","Leve até a altura do rosto."],["Apoie o cotovelo","","Reduz o peso sobre o pescoço."],["Troque de mão","","Alterne a cada poucos minutos."]]) },
  { id: "em-pe-por-horas", titulo: "Ficar em pé por horas", tempo: "2 min", cards: lista("hábito: Ficar em pé", "2 min de leitura", "para quem trabalha em pé.", [["Alterne o peso","","Passe o peso de uma perna para a outra."],["Apoie um pé num degrau","","Alivia a lombar."],["Calçado com apoio","","Prefira solado com amortecimento."]]) },
  { id: "levantar-peso", titulo: "Levantar peso sem travar a lombar", tempo: "2 min", cards: lista("hábito: Levantar peso", "2 min de leitura", "para quem carrega peso.", [["Dobre os joelhos","","Agache em vez de curvar as costas."],["Carga perto do corpo","","Quanto mais perto, menos esforço na lombar."],["Não gire com peso","","Mova os pés para virar."]]) },
  { id: "dormir", titulo: "Dormir sem acordar travado", tempo: "2 min", cards: lista("hábito: Dormir", "2 min de leitura", "para quem acorda com o corpo travado.", [["Travesseiro na altura do ombro","","Se dorme de lado, preencha o espaço do pescoço."],["Travesseiro entre os joelhos","","Mantém o quadril alinhado."],["Evite dormir de bruços","","Gira o pescoço por horas."]]) } ] },
 { id: 3, nome: "Módulo 3 — Lanches de Movimento (60 s)", guias: [
  { id: "pausa-cadeira", titulo: "Pausa da Cadeira", tempo: "60 s", cards: lista("Pausa da Cadeira", "60 segundos", "para quem trabalha sentado.", [["Recolher o queixo","5x","Leve o queixo para trás."],["Juntar as escápulas","5x","Aproxime as omoplatas."],["Inclinar a pelve","10x","Movimento pequeno, sentado."],["Ficar em pé e sentar","","Levante e sente uma vez."]]) },
  { id: "pausa-balcao", titulo: "Pausa do Balcão", tempo: "60 s", cards: lista("Pausa do Balcão", "60 segundos", "para quem trabalha em pé.", [["Subir na ponta dos pés","10x","Suba e desça devagar."],["Alongar a panturrilha","15 s cada","Mãos no balcão, perna atrás."],["Leve extensão de lombar","5x","Mãos na cintura, incline para trás."]]) },
  { id: "pausa-teclado", titulo: "Pausa do Teclado", tempo: "60 s", cards: lista("Pausa do Teclado", "60 segundos", "para quem faz movimento repetitivo.", [["Alongar flexores e extensores","10 s cada","Braço esticado, puxe os dedos."],["Abrir e fechar a mão","10x","Devagar."],["Rolar ombros","5x","Círculos para trás."]]) },
  { id: "pausa-carga", titulo: "Pausa da Carga", tempo: "60 s", cards: lista("Pausa da Carga", "60 segundos", "para quem faz esforço físico.", [["Extensão de lombar","5x","Mãos na cintura."],["Joelhos ao peito em pé","5x cada","Alterne as pernas."],["Abrir o peito com mãos atrás","15 s","Entrelace as mãos atrás das costas."]]) },
  { id: "pausa-olhos-mandibula", titulo: "Pausa dos Olhos e Mandíbula", tempo: "60 s", cards: lista("Pausa dos Olhos e Mandíbula", "60 segundos", "para todos.", [["Olhar longe","20 s","Foque em algo distante."],["Soltar a mandíbula","","Dentes afastados, língua relaxada."],["3 respirações lentas","3x","Inspire pelo nariz, solte pela boca."]]) } ] },
 { id: 4, nome: "Módulo 4 — Mais Alívio (extra)", guias: [
  { id: "extra-lombar", titulo: "Lombar Extra", tempo: "3 min", cards: [
    capa("Lombar Extra", "3 minutos", "para quem precisa de mais alívio nas costas."),
    ex("Gato-camelo em quatro apoios", "8x", "De joelhos e mãos no chão, arredonde as costas soltando o ar e depois abra o peito puxando o ar.", "Solte o ar ao arredondar.", "foto: quatro apoios"),
    ex("Posição da criança", "30 s", "Sentado sobre os calcanhares, estique os braços à frente e descanse o tronco.", "Respire fundo e devagar.", "foto: posição da criança"),
    ex("Rotação lombar deitado", "30 s cada lado", "Deitado, braços abertos, leve os joelhos dobrados para um lado, sem forçar.", "Solte o ar ao descer os joelhos.", "foto: deitado de cima"),
    ex("Um joelho ao peito", "30 s cada", "Deitado, abrace um joelho ao peito e mantenha a outra perna esticada.", "Respire devagar.", "foto: deitado"),
    ex("Alongamento deitado", "30 s", "Deitado, estique os braços acima da cabeça e as pernas, alongando o corpo todo.", "Inspire ao esticar, solte ao relaxar.", "foto: deitado")] },
  { id: "extra-tronco-peito", titulo: "Tronco e Peito", tempo: "3 min", cards: [
    capa("Tronco e Peito", "3 minutos", "para quem passa o dia curvado."),
    ex("Abrir o peito na parede", "30 s cada lado", "Mão apoiada na parede, braço esticado, gire o tronco devagar para o lado oposto.", "Respire sem prender o ar.", "foto: na parede"),
    ex("Abrir o peito deitado", "30 s", "Deitado, joelhos dobrados e braços abertos com as palmas para cima.", "Solte o ar e deixe o peito abrir.", "foto: deitado"),
    ex("Rotação de tronco sentado", "8x cada lado", "Sentado, segure o encosto da cadeira e gire o tronco devagar.", "Solte o ar ao girar.", "foto: sentado"),
    ex("Flexão e extensão sentado", "8x", "Sentado, curve o tronco para frente e depois volte abrindo o peito.", "Solte o ar ao curvar.", "foto: sentado, perfil"),
    ex("Alongar o trapézio", "30 s cada lado", "Sentado, incline a cabeça para o lado e deixe o ombro oposto descer.", "Respire fundo e devagar.", "foto: sentado, de frente")] },
  { id: "extra-quadril-pernas", titulo: "Quadril e Pernas", tempo: "3 min", cards: [
    capa("Quadril e Pernas", "3 minutos", "para quem passa o dia sentado ou em pé."),
    ex("Sentar e levantar", "8x", "Cruze os braços no peito, levante sem apoio das mãos e sente devagar.", "Solte o ar ao levantar.", "foto: perfil"),
    ex("Elevar a perna sentado", "10x cada", "Sentado, estique um joelho até a perna ficar reta e volte devagar.", "Solte o ar ao subir a perna.", "foto: sentado, perfil"),
    ex("Contração do quadríceps", "10x, segura 5 s", "Sentado com a perna esticada, aperte a coxa e segure.", "Respire sem prender o ar.", "foto: sentado, perfil"),
    ex("Abertura do quadril sentado", "10x, segura 5 s", "Sentado, mãos na lateral dos joelhos, empurre os joelhos para fora contra as mãos.", "Solte o ar ao empurrar.", "foto: sentado, de frente"),
    ex("Elevação lateral de perna", "10x cada lado", "Deitado de lado, apoie-se no antebraço e suba a perna de cima, sem girar o quadril.", "Solte o ar ao subir.", "foto: deitado de lado"),
    ex("Deslizar o pé deitado", "10x cada", "Deitado, joelhos dobrados, deslize um pé para frente até esticar a perna e volte.", "Respire devagar.", "foto: deitado")] },
  { id: "extra-pes-circulacao", titulo: "Pés e Circulação", tempo: "3 min", cards: [
    capa("Pés e Circulação", "3 minutos", "para quem passa o dia em pé ou sente as pernas cansadas."),
    ex("Pernas na parede", "60 s", "Deitado, apoie as pernas esticadas na parede, braços ao lado do corpo, e relaxe.", "Respire devagar.", "foto: pernas na parede"),
    ex("Bombeamento de tornozelo", "15x cada", "Sentado, com a perna esticada, suba e desça a ponta do pé.", "Respire no ritmo do movimento.", "foto: sentado, perfil"),
    ex("Puxar a toalha com os dedos", "10x cada pé", "Sentado, pé sobre uma toalha no chão; use os dedos para puxar a toalha para você.", "Respire devagar.", "foto: sentado, perfil")] } ] },
 { id: 5, nome: "Bônus", guias: [
  { id: "bonus-trava-seguranca", titulo: "Trava de Segurança Articular", tempo: "4 min", cards: [
    capa("Trava de Segurança Articular", "4 minutos", "5 erros que pioram a dor."),
    ...["Alongar com dor aguda","Dar “tranco” no pescoço","Ficar parado de vez","Forçar a amplitude com balanço","Ignorar formigamento"].map((e,i)=>({t:"erro",n:i+1,titulo:e})),
    { t: "fecha-seg" } ] },
  { id: "bonus-checklist-bolso", titulo: "Checklist de Bolso", tempo: "3 min", cards: [ { t: "checklist" } ] } ] }
];
