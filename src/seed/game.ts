import type { Board, Frame, GuidePage, Lesson, Mission, Position, QuizQuestion } from '../lib/types'

type PT = [id: string, team: 'a' | 'b', x: number, y: number, label?: string]
const fr = (players: PT[], ball: [number, number], note?: string): Frame => ({
  players: players.map(([id, team, x, y, label]) => ({ id, team, x, y, label, me: id === 'me' })), ball: { x: ball[0], y: ball[1] }, note,
})
const ME = 'VOCÊ'
const board = (field: Board['field'], situation: Frame[], error: Frame[], right: Frame[]): Board => ({ field, scenes: { situation, error, right } })

// Coordenadas normalizadas 0–100 (x: comprimento, ataque para a direita; y: largura). 'me' = o aluno.
const L = (o: Omit<Lesson, 'published' | 'reviewed' | 'positions'> & { positions?: Position[] }): Lesson => ({ positions: [], published: true, reviewed: false, ...o })

export const LESSONS: Lesson[] = [
  L({ id: 'l1', order_idx: 1, title: 'Olhar antes de receber', minutes: 3, summary: 'Quem olha antes de receber já sabe o que fazer com a bola.',
    situation: 'O companheiro vai passar para você. Tem um marcador logo atrás.',
    error_text: 'Ficar parado olhando só a bola. A bola chega, o marcador já está colado e você perde ela de costas.',
    right_text: 'Olhe por cima do ombro uma ou duas vezes antes da bola chegar. Veja onde tem espaço e já receba virando para ele.',
    board: board('11', [fr([['me', 'a', 45, 50, ME], ['c1', 'a', 28, 68], ['o1', 'b', 52, 47]], [28, 68], 'O passe vem do companheiro.')],
      [fr([['me', 'a', 45, 50, ME], ['c1', 'a', 28, 68], ['o1', 'b', 52, 47]], [28, 68], 'Você só olha a bola...'), fr([['me', 'a', 45, 50, ME], ['c1', 'a', 28, 68], ['o1', 'b', 47, 49]], [45, 50], 'O marcador chega junto e rouba.')],
      [fr([['me', 'a', 45, 50, ME], ['c1', 'a', 28, 68], ['o1', 'b', 52, 47]], [28, 68], 'Olhe por cima do ombro: onde tem espaço?'), fr([['me', 'a', 50, 60, ME], ['c1', 'a', 28, 68], ['o1', 'b', 52, 48]], [40, 64], 'Receba já virando para o espaço.'), fr([['me', 'a', 58, 62, ME], ['c1', 'a', 28, 68], ['o1', 'b', 53, 52]], [58, 62], 'Saia com a bola protegida.')]) }),
  L({ id: 'l2', order_idx: 2, title: 'Desmarque de apoio', minutes: 3, summary: 'Venha em direção à bola para ajudar o companheiro pressionado.',
    situation: 'Seu companheiro está com a bola e um marcador em cima. Você está longe, parado.',
    error_text: 'Ficar parado longe, atrás do seu marcador. O companheiro não tem para quem passar.',
    right_text: 'Chegue perto da bola em ângulo, fora da sombra do marcador. Dê uma linha de passe limpa.',
    board: board('11', [fr([['me', 'a', 55, 40, ME], ['c1', 'a', 30, 50], ['o1', 'b', 36, 50], ['o2', 'b', 58, 45]], [30, 50])],
      [fr([['me', 'a', 55, 40, ME], ['c1', 'a', 30, 50], ['o1', 'b', 36, 50], ['o2', 'b', 58, 45]], [30, 50], 'Você fica parado e longe...'), fr([['me', 'a', 55, 40, ME], ['c1', 'a', 30, 50], ['o1', 'b', 36, 50], ['o2', 'b', 58, 45]], [34, 50], 'Sem opção, o companheiro perde a bola.')],
      [fr([['me', 'a', 55, 40, ME], ['c1', 'a', 30, 50], ['o1', 'b', 36, 50], ['o2', 'b', 58, 45]], [30, 50]), fr([['me', 'a', 44, 34, ME], ['c1', 'a', 30, 50], ['o1', 'b', 36, 50], ['o2', 'b', 56, 44]], [30, 50], 'Venha em direção à bola, em ângulo.'), fr([['me', 'a', 44, 34, ME], ['c1', 'a', 30, 50], ['o1', 'b', 36, 50], ['o2', 'b', 56, 44]], [44, 34], 'Passe limpo, longe do marcador.')]) }),
  L({ id: 'l3', order_idx: 3, title: 'Desmarque de ruptura', minutes: 3, summary: 'Corra nas costas da defesa quando o companheiro olhar.',
    situation: 'A defesa está em linha. Seu companheiro está com a bola no meio.',
    error_text: 'Correr em linha reta de frente para o zagueiro, ficando fácil de marcar (ou impedido).',
    right_text: 'Saia de lado, na diagonal, nas costas do zagueiro, entre ele e o lateral, quando o companheiro estiver olhando.',
    board: board('11', [fr([['me', 'a', 62, 40, ME], ['c1', 'a', 44, 50], ['d1', 'b', 70, 30], ['d2', 'b', 70, 50], ['d3', 'b', 70, 70]], [44, 50])],
      [fr([['me', 'a', 62, 40, ME], ['c1', 'a', 44, 50], ['d1', 'b', 70, 30], ['d2', 'b', 70, 50], ['d3', 'b', 70, 70]], [44, 50], 'Você corre reto, de frente...'), fr([['me', 'a', 69, 42, ME], ['c1', 'a', 44, 50], ['d1', 'b', 70, 30], ['d2', 'b', 68, 46], ['d3', 'b', 70, 70]], [44, 50], 'O zagueiro marca fácil.')],
      [fr([['me', 'a', 62, 40, ME], ['c1', 'a', 44, 50], ['d1', 'b', 70, 30], ['d2', 'b', 70, 50], ['d3', 'b', 70, 70]], [44, 50], 'Espere o companheiro olhar.'), fr([['me', 'a', 78, 40, ME], ['c1', 'a', 44, 50], ['d1', 'b', 70, 30], ['d2', 'b', 70, 50], ['d3', 'b', 70, 70]], [44, 50], 'Saída na diagonal, nas costas.'), fr([['me', 'a', 78, 40, ME], ['c1', 'a', 44, 50], ['d1', 'b', 70, 30], ['d2', 'b', 70, 50], ['d3', 'b', 70, 70]], [72, 41], 'Passe no espaço.')]) }),
  L({ id: 'l4', order_idx: 4, title: 'Toque e contra-movimento', minutes: 3, summary: 'Finja um lado e saia pelo outro quando o companheiro olhar.',
    situation: 'O marcador está de olho em você e te segue.',
    error_text: 'Ir sempre para o mesmo lado e na mesma hora. O marcador adivinha e corta o passe.',
    right_text: 'Dê um passo curto para um lado como se fosse buscar a bola, plante o pé e saia forte para o lado contrário.',
    board: board('11', [fr([['me', 'a', 56, 50, ME], ['c1', 'a', 38, 50], ['o1', 'b', 61, 50]], [38, 50])],
      [fr([['me', 'a', 56, 50, ME], ['c1', 'a', 38, 50], ['o1', 'b', 61, 50]], [38, 50]), fr([['me', 'a', 50, 40, ME], ['c1', 'a', 38, 50], ['o1', 'b', 52, 42]], [38, 50], 'Sempre o mesmo lado: ele corta.')],
      [fr([['me', 'a', 56, 50, ME], ['c1', 'a', 38, 50], ['o1', 'b', 61, 50]], [38, 50]), fr([['me', 'a', 52, 44, ME], ['c1', 'a', 38, 50], ['o1', 'b', 56, 45]], [38, 50], 'Passo curto: finge buscar a bola.'), fr([['me', 'a', 60, 62, ME], ['c1', 'a', 38, 50], ['o1', 'b', 55, 46]], [38, 50], 'Plante e saia pelo outro lado.')]) }),
  L({ id: 'l5', order_idx: 5, title: 'Ficar nas costas do marcador', minutes: 3, summary: 'Quem some da vista do marcador fica livre.',
    situation: 'O marcador olha para a bola.',
    error_text: 'Ficar de frente para o marcador, à vista dele.',
    right_text: 'Fique atrás do marcador, na parte que ele não vê, e só apareça quando o passe sair.',
    board: board('11', [fr([['me', 'a', 52, 50, ME], ['c1', 'a', 30, 50], ['o1', 'b', 57, 50]], [30, 50])],
      [fr([['me', 'a', 52, 50, ME], ['c1', 'a', 30, 50], ['o1', 'b', 57, 50]], [30, 50], 'Você fica à vista dele...'), fr([['me', 'a', 52, 50, ME], ['c1', 'a', 30, 50], ['o1', 'b', 52, 50]], [40, 50], 'Ele corta o passe.')],
      [fr([['me', 'a', 52, 50, ME], ['c1', 'a', 30, 50], ['o1', 'b', 57, 50]], [30, 50]), fr([['me', 'a', 62, 56, ME], ['c1', 'a', 30, 50], ['o1', 'b', 57, 50]], [30, 50], 'Dê um passo para as costas dele.'), fr([['me', 'a', 62, 56, ME], ['c1', 'a', 30, 50], ['o1', 'b', 57, 50]], [62, 56], 'Apareça quando o passe sair.')]) }),
  L({ id: 'l6', order_idx: 6, title: 'Dar opção de passe e manter distância', minutes: 3, summary: 'Nem colado, nem longe demais: abra o ângulo.',
    situation: 'Dois companheiros muito perto do portador da bola.',
    error_text: 'Todos na mesma linha, um atrás do outro. Um único marcador corta tudo.',
    right_text: 'Abra triângulos: um mais perto, outro mais longe, em ângulos diferentes, a uns 10 a 15 metros.',
    board: board('11', [fr([['me', 'a', 52, 54, ME], ['c1', 'a', 50, 50], ['c2', 'a', 54, 52], ['o1', 'b', 60, 50]], [50, 50])],
      [fr([['me', 'a', 52, 54, ME], ['c1', 'a', 50, 50], ['c2', 'a', 54, 52], ['o1', 'b', 60, 50]], [50, 50], 'Todo mundo amontoado.'), fr([['me', 'a', 52, 54, ME], ['c1', 'a', 50, 50], ['c2', 'a', 54, 52], ['o1', 'b', 56, 51]], [50, 50], 'Um marcador pega os três.')],
      [fr([['me', 'a', 52, 54, ME], ['c1', 'a', 50, 50], ['c2', 'a', 54, 52], ['o1', 'b', 60, 50]], [50, 50]), fr([['me', 'a', 38, 72, ME], ['c1', 'a', 50, 50], ['c2', 'a', 66, 28], ['o1', 'b', 60, 50]], [50, 50], 'Abra o triângulo.'), fr([['me', 'a', 38, 72, ME], ['c1', 'a', 50, 50], ['c2', 'a', 66, 28], ['o1', 'b', 60, 50]], [38, 72], 'Várias opções de passe.')]) }),
  L({ id: 'l7', order_idx: 7, title: 'Leitura do marcador no 1 contra 1', minutes: 4, summary: 'Antes de driblar, leia o marcador: para onde olha, perna forte, o que ele sempre faz.',
    situation: 'Você vai enfrentar o marcador. Ele está com o corpo mais para o lado de dentro.',
    error_text: 'Entrar sempre pelo mesmo lado, mesmo que seja onde ele está mais forte (e previsível).',
    right_text: 'Veja para onde o marcador olha e qual perna é a forte. Ataque o lado em que ele está de pé fraco. Quem corta sempre para dentro é previsível.',
    board: board('11', [fr([['me', 'a', 40, 50, ME], ['o1', 'b', 52, 50]], [42, 50])],
      [fr([['me', 'a', 40, 50, ME], ['o1', 'b', 52, 50]], [42, 50]), fr([['me', 'a', 49, 44, ME], ['o1', 'b', 51, 44]], [50, 44], 'Entrou onde ele esperava.')],
      [fr([['me', 'a', 40, 50, ME], ['o1', 'b', 52, 50]], [42, 50], 'Leia: ele fecha por dentro.'), fr([['me', 'a', 47, 58, ME], ['o1', 'b', 53, 52]], [48, 58], 'Ataque o lado aberto.'), fr([['me', 'a', 60, 64, ME], ['o1', 'b', 54, 54]], [60, 64], 'Você passou.')]) }),
  ...([
    ['goleiro', 'Posicionamento do goleiro', 'Goleiro no ataque ajuda na saída; na defesa fica entre a bola e o gol e acompanha o jogo.', [['me', 'a', 8, 50, ME]], [['me', 'a', 6, 50, ME]], [['me', 'a', 14, 50, ME]], 'Fica parado na linha do gol, sem acompanhar a bola.', 'Fique alguns passos à frente da linha, na linha entre a bola e o gol, pronto para sair.'],
    ['zagueiro', 'Posicionamento do zagueiro', 'Zagueiro mantém a linha, cobre o companheiro e acompanha o atacante.', [['me', 'a', 28, 50, ME]], [['me', 'a', 20, 50, ME]], [['me', 'a', 32, 46, ME]], 'Ficar colado no goleiro, deixando espaço enorme na frente.', 'Suba junto com a linha e fique de lado, vendo a bola e o atacante.'],
    ['lateral', 'Posicionamento do lateral', 'Lateral apoia o ataque quando dá e recua quando perde a bola.', [['me', 'a', 55, 90, ME]], [['me', 'a', 70, 90, ME]], [['me', 'a', 56, 82, ME]], 'Subir sem avisar e deixar o corredor livre.', 'Suba quando o meia segura a bola e recue quando perder.'],
    ['meia', 'Posicionamento do meia', 'Meia é a ligação: está sempre entre as linhas, em ângulo com o portador.', [['me', 'a', 52, 50, ME]], [['me', 'a', 52, 50, ME]], [['me', 'a', 56, 42, ME]], 'Ficar na frente do volante, fácil de marcar.', 'Fique entre as linhas, em ângulo, longe da sombra do volante.'],
    ['atacante', 'Posicionamento do atacante', 'Atacante vive na linha da defesa: aparece, some e ataca o espaço.', [['me', 'a', 76, 50, ME]], [['me', 'a', 72, 50, ME]], [['me', 'a', 80, 36, ME]], 'Ficar de frente para o zagueiro, parado.', 'Fique no ombro do zagueiro e ataque o espaço entre ele e o lateral.'],
  ] as const).map(([pos, title, summary, s, e, r, errTxt, rightTxt], i) => L({
    id: `l8_${pos}`, order_idx: 8, positions: [pos as Position], title, minutes: 3, summary,
    situation: 'Sua equipe está com a bola e depois perde a bola. Onde você deve estar?', error_text: errTxt, right_text: rightTxt,
    board: board('11', [fr([...s, ['c1', 'a', 45, 55], ['o1', 'b', 60, 45]] as PT[], [45, 55])], [fr([...e, ['c1', 'a', 45, 55], ['o1', 'b', 60, 45]] as PT[], [45, 55], 'Posição errada.')], [fr([...r, ['c1', 'a', 45, 55], ['o1', 'b', 60, 45]] as PT[], [45, 55], 'Posição certa.')]),
  })),
]

const q = (id: string, lesson: string, prompt: string, players: PT[], ball: [number, number], ans: [number, number, number], explanation: string, field: Board['field'] = '11'): QuizQuestion =>
  ({ id, lesson_id: lesson, prompt, board: { field, frame: fr(players, ball) }, answer: { x: ans[0], y: ans[1], r: ans[2] }, explanation })

export const QUIZ: QuizQuestion[] = [
  q('q1a', 'l1', 'O companheiro vai passar. O marcador está colado atrás de você. Onde você recebe?', [['c1', 'a', 28, 68], ['o1', 'b', 56, 48]], [28, 68], [48, 62, 10], 'Fora da sombra do marcador, já vendo o espaço à frente.'),
  q('q1b', 'l1', 'Bola no lado esquerdo. Você é o meia e tem dois marcadores perto. Onde olha e fica?', [['c1', 'a', 30, 25], ['o1', 'b', 54, 45], ['o2', 'b', 50, 58]], [30, 25], [46, 36, 10], 'No espaço livre entre os dois marcadores, em ângulo com o passador.'),
  q('q1c', 'l1', 'Bola no pé do lateral, marcador na sua frente. Onde se posiciona?', [['c1', 'a', 40, 88], ['o1', 'b', 58, 62]], [40, 88], [46, 66, 10], 'Em ângulo, longe da linha do marcador.'),
  q('q2a', 'l2', 'Seu companheiro está pressionado na lateral. Onde você se oferece?', [['c1', 'a', 30, 60], ['o1', 'b', 36, 60]], [30, 60], [42, 46, 10], 'Em ângulo diagonal, perto o bastante para um passe seguro e fora da sombra do marcador.'),
  q('q2b', 'l2', 'Portador no meio, marcador de frente. Você vem de longe: onde?', [['c1', 'a', 40, 50], ['o1', 'b', 46, 50]], [40, 50], [50, 62, 10], 'Venha em direção à bola, mas de lado.'),
  q('q2c', 'l2', 'Portador de costas para o gol, um marcador em cima. Onde dar apoio?', [['c1', 'a', 62, 50], ['o1', 'b', 68, 50]], [62, 50], [54, 38, 10], 'Chegue por trás do portador, aberto, para ele devolver de primeira.'),
  q('q3a', 'l3', 'A defesa está em linha. Seu meia vai levantar a cabeça. Onde atacar?', [['c1', 'a', 44, 50], ['d1', 'b', 70, 30], ['d2', 'b', 70, 50], ['d3', 'b', 70, 70]], [44, 50], [78, 40, 9], 'O espaço nas costas, entre o zagueiro e o lateral.'),
  q('q3b', 'l3', 'Zagueiro adversário olha só para a bola. Onde você corre?', [['c1', 'a', 50, 70], ['d1', 'b', 72, 40], ['d2', 'b', 72, 62]], [50, 70], [80, 52, 9], 'Nas costas do zagueiro que está distraído.'),
  q('q3c', 'l3', 'Lateral adversário avançou. Onde é a ruptura?', [['c1', 'a', 50, 50], ['d1', 'b', 68, 70], ['d2', 'b', 70, 40]], [50, 50], [80, 76, 9], 'No corredor que o lateral deixou.'),
  q('q4a', 'l4', 'O marcador te cobre por dentro (y menor). Depois da finta, para onde sai?', [['c1', 'a', 38, 50], ['o1', 'b', 56, 45]], [38, 50], [60, 64, 10], 'Para o lado oposto de onde ele está carregando o corpo.'),
  q('q4b', 'l4', 'Marcador na sua frente fecha o passe curto. Você faz o contra-movimento: onde recebe?', [['c1', 'a', 38, 50], ['o1', 'b', 55, 50]], [38, 50], [66, 40, 10], 'Pelo lado contrário ao que você fingiu, no espaço atrás dele.'),
  q('q4c', 'l4', 'Dois companheiros, marcador colado em você pelo lado de fora. Para onde sair?', [['c1', 'a', 40, 78], ['o1', 'b', 58, 82]], [40, 78], [60, 62, 10], 'Para dentro, o lado que ele deixou aberto.'),
  q('q5a', 'l5', 'O marcador olha a bola. Onde fica a zona cega dele?', [['c1', 'a', 30, 50], ['o1', 'b', 55, 50]], [30, 50], [62, 58, 8], 'Atrás e ao lado dele, fora do campo de visão.'),
  q('q5b', 'l5', 'Marcador marca por dentro. Onde some da vista dele?', [['c1', 'a', 38, 30], ['o1', 'b', 56, 40]], [38, 30], [62, 28, 9], 'Nas costas dele, pelo lado de fora.'),
  q('q5c', 'l5', 'Dois marcadores. Em qual espaço você some?', [['c1', 'a', 40, 50], ['o1', 'b', 56, 42], ['o2', 'b', 56, 62]], [40, 50], [64, 52, 8], 'No vão entre os dois, atrás da linha de visão.'),
  q('q6a', 'l6', 'Dois companheiros já estão perto da bola. Onde você abre o triângulo?', [['c1', 'a', 50, 50], ['c2', 'a', 54, 52], ['o1', 'b', 60, 50]], [50, 50], [38, 74, 10], 'Longe da linha dos outros dois e com ângulo livre.'),
  q('q6b', 'l6', 'Você está perto demais do portador. Onde se afasta?', [['c1', 'a', 50, 50], ['o1', 'b', 58, 50]], [50, 50], [34, 28, 10], 'Para um ângulo de uns 10 a 15 metros.'),
  q('q6c', 'l6', 'Portador no corredor. Onde ficar para dar uma segunda opção?', [['c1', 'a', 50, 90], ['o1', 'b', 58, 82]], [50, 90], [40, 70, 10], 'Em diagonal atrás da bola, com linha de passe limpa.'),
  q('q7a', 'l7', 'O marcador carrega o corpo para dentro. Por onde você ataca?', [['o1', 'b', 52, 50]], [42, 50], [58, 66, 10], 'Pelo lado de fora, onde ele deixou o espaço.'),
  q('q7b', 'l7', 'O marcador sempre vai no pé direito. Qual lado você atrai?', [['o1', 'b', 55, 50]], [44, 50], [60, 36, 10], 'Pelo lado do pé fraco.'),
  q('q7c', 'l7', 'Marcador de costas olhando a bola. Onde você parte?', [['o1', 'b', 58, 52]], [44, 52], [64, 44, 10], 'Pelo lado em que o corpo dele não está virado.'),
  q('q8a', 'l8_meia', 'Sua equipe ataca pela direita. Onde o meia fica?', [['c1', 'a', 62, 82], ['o1', 'b', 58, 60]], [62, 82], [60, 50, 10], 'No meio, em ângulo, pronto para receber de volta.'),
  q('q8b', 'l8_zagueiro', 'Sua equipe perde a bola no meio. Onde o zagueiro fica?', [['o1', 'b', 45, 50], ['c1', 'a', 52, 45]], [45, 50], [30, 50, 10], 'Na frente do gol, em linha, acompanhando a bola.'),
  q('q8c', 'l8_atacante', 'O meio-campo vai lançar. Onde o atacante está?', [['c1', 'a', 50, 50], ['d1', 'b', 72, 40], ['d2', 'b', 72, 62]], [50, 50], [74, 50, 10], 'No ombro do zagueiro, entre os dois, pronto para atacar o espaço.'),
]

export const MISSIONS: Mission[] = [
  { id: 'm1', title: 'Olhar por cima do ombro antes de receber', body: 'Antes de cada passe que for receber, olhe por cima do ombro pelo menos uma vez.', positions: [], lesson_id: 'l1' },
  { id: 'm2', title: 'Vir em direção à bola', body: 'Quando o companheiro estiver pressionado, venha ao encontro da bola em ângulo.', positions: [], lesson_id: 'l2' },
  { id: 'm3', title: 'Uma ruptura nas costas da defesa', body: 'Tente pelo menos 3 rupturas em diagonal quando o companheiro estiver olhando.', positions: [], lesson_id: 'l3' },
  { id: 'm4', title: 'Finja um lado, saia pelo outro', body: 'Use o contra-movimento pelo menos 3 vezes antes de pedir a bola.', positions: [], lesson_id: 'l4' },
  { id: 'm5', title: 'Fique nas costas do marcador', body: 'Procure a zona cega do marcador sempre que o time estiver com a bola.', positions: [], lesson_id: 'l5' },
  { id: 'm6', title: 'Abra o triângulo', body: 'Sempre dê uma opção de passe em ângulo e a uns 10 a 15 metros do portador.', positions: [], lesson_id: 'l6' },
  { id: 'm7', title: 'Leia o marcador no 1 contra 1', body: 'Antes de driblar, veja para onde o marcador olha e qual é a perna forte dele.', positions: [], lesson_id: 'l7' },
  { id: 'm8g', title: 'Goleiro: ficar na linha entre a bola e o gol', body: 'Acompanhe a bola e mantenha-se na linha entre a bola e o gol.', positions: ['goleiro'], lesson_id: 'l8_goleiro' },
  { id: 'm8z', title: 'Zagueiro: subir e descer com a linha', body: 'Suba e recue com a linha de defesa, sem deixar espaço nas costas.', positions: ['zagueiro'], lesson_id: 'l8_zagueiro' },
  { id: 'm8l', title: 'Lateral: apoiar e voltar', body: 'Apoie quando o meia segura a bola e volte quando perder.', positions: ['lateral'], lesson_id: 'l8_lateral' },
  { id: 'm8m', title: 'Meia: ficar entre as linhas', body: 'Fique em ângulo, entre as linhas, longe da sombra do volante.', positions: ['meia'], lesson_id: 'l8_meia' },
  { id: 'm8a', title: 'Atacante: no ombro do zagueiro', body: 'Fique no ombro do zagueiro e ataque o espaço quando a bola sair.', positions: ['atacante'], lesson_id: 'l8_atacante' },
]

const DISCLAIMER = 'Orientação geral de treino, sem diagnóstico e sem promessa de resultado. Não substitui orientação médica nem de profissional de educação física. Em caso de dor forte, inchaço ou dor que não passa, procure um profissional de saúde presencialmente.'

export const GUIDE: GuidePage[] = [
  { id: 'g_folga', kind: 'guia', order_idx: 1, title: 'Dia de folga: mobilidade de 12 minutos', body: `Rotina leve para o dia sem treino. Movimentos suaves, sem forçar.\n\n${DISCLAIMER}`,
    steps: [{ ex: 'mob_tornozelo', secs: 40, side: true }, { ex: 'mob_quadril', secs: 40, side: true }, { ex: 'mob_posterior', secs: 40, side: true }, { ex: 'along_quadriceps', secs: 30, side: true }, { ex: 'along_flexores', secs: 30, side: true }, { ex: 'along_adutores', secs: 30, side: true }, { ex: 'along_gluteos', secs: 30, side: true }, { ex: 'along_panturrilha', secs: 30, side: true }, { ex: 'respiracao', secs: 90 }] },
  { id: 'g_manha', kind: 'guia', order_idx: 2, title: 'Manhã do jogo: soltar o corpo', body: `Movimentos dinâmicos para acordar o corpo sem cansar. O alongamento parado fica para depois do jogo.\n\n${DISCLAIMER}`,
    steps: [{ ex: 'trote_lugar', secs: 60 }, { ex: 'mob_tornozelo', secs: 30, side: true }, { ex: 'mob_quadril', secs: 30, side: true }, { ex: 'mob_posterior', secs: 30, side: true }, { ex: 'agachamento_livre', secs: 40 }, { ex: 'afundo_alternado', secs: 40 }] },
  { id: 'g_dinamico', kind: 'guia', order_idx: 3, title: 'Aquecimento dinâmico completo', body: `Antes de qualquer treino ou jogo: movimento, não alongamento parado. Aquecimento ajuda a preparar o corpo, não elimina o risco de lesão.\n\n${DISCLAIMER}`,
    steps: [{ ex: 'trote_lugar', secs: 60 }, { ex: 'skipping', secs: 40 }, { ex: 'elevacao_joelhos', secs: 40 }, { ex: 'corrida_lateral', secs: 40 }, { ex: 'afundo_alternado', secs: 40 }, { ex: 'mob_quadril', secs: 30, side: true }, { ex: 'mob_tornozelo', secs: 30, side: true }] },
  { id: 'g_planner', kind: 'planner', order_idx: 1, title: 'Como o Planner de Temporada ajusta sua carga', body: `Informe os dias de jogo e a data da final.\n\n• 48 horas antes do jogo: sem saltos intensos nem arrancadas máximas (LEVE).\n• Dia do jogo: aquecimento de jogo e, depois, o pós-jogo.\n• Dia seguinte: só recuperação, com a pergunta "Como você acordou hoje?".\n• Semana da final: carga reduzida.\n• Semana sem jogo: carga normal.\n\n${DISCLAIMER}`, steps: [] },
  { id: 'g_posjogo', kind: 'posjogo', order_idx: 1, title: 'Protocolo de pós-jogo (10 minutos)', body: `Faça depois do jogo, ainda aquecido. Beba água e durma bem.\n\n${DISCLAIMER}`,
    steps: [{ ex: 'caminhada_leve', secs: 150 }, { ex: 'mob_quadril', secs: 40, side: true }, { ex: 'along_posterior', secs: 40, side: true }, { ex: 'along_quadriceps', secs: 40, side: true }, { ex: 'along_panturrilha', secs: 40, side: true }, { ex: 'along_gluteos', secs: 40, side: true }, { ex: 'respiracao', secs: 90 }] },
  { id: 'g_aquecer_jogo', kind: 'aquecimento_jogo', order_idx: 1, title: 'Aquecer para o jogo (10 minutos, sem equipamento)', body: 'Faça no campo antes de entrar. Sem alongamento parado. Duas arrancadas curtas e progressivas no final.',
    steps: [{ ex: 'trote_lugar', secs: 90 }, { ex: 'skipping', secs: 60 }, { ex: 'elevacao_joelhos', secs: 60 }, { ex: 'corrida_lateral', secs: 90 }, { ex: 'afundo_alternado', secs: 60 }, { ex: 'mob_quadril', secs: 45, side: true }, { ex: 'mob_tornozelo', secs: 30, side: true }, { ex: 'arrancada_progressiva', secs: 30 }, { ex: 'arrancada_progressiva', secs: 30 }] },
]

export const PRESEASON_NOTE = `Programa bônus PRÉ-TEMPORADA DA VÁRZEA: 4 semanas, 3 treinos por semana. ${DISCLAIMER}`
