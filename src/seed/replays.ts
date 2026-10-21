import type { Act, BallSeg, Replay, Track } from '../lib/replay'

// Coordenadas em metros. x = sentido do ataque, y = lateral (positivo = para o lado da câmera). Campo: centro em (0,0), gol em x = 52,5.
type KT = [t: number, x: number, y: number, act?: Act, face?: number]
const T = (id: string, team: 'a' | 'b', role: string, keys: KT[], hero = false): Track => ({ id, team, role, hero, keys: keys.map(([t, x, y, act, face]) => ({ t, x, y, act, face })) })
const carry = (by: string, from: number, to: number): BallSeg => ({ type: 'carry', by, from, to })
const travel = (from: number, to: number, a: [number, number] | string, b: [number, number] | string, arc = 0): BallSeg => ({ type: 'travel', from, to, a, b, arc })
const at = (from: number, to: number, p: [number, number] | string): BallSeg => ({ type: 'at', from, to, at: p })

const finta = (id: string, title: string, act: Act, sign: 1 | -1, text: string[]): Replay => ({
  id, title, category: 'drible', level: act === 'pedal' ? 2 : 1, duration: 8, pitch: 'court', focus: { x: 2, y: 0, size: 16 },
  summary: act === 'pedal' ? 'Passe o pé por cima da bola e saia pelo lado oposto.' : 'Quebre o ritmo, finja um lado e saia pelo outro.',
  tracks: [
    T('A', 'a', 'VOCÊ', [[0, -14, 3 * sign, 'jog'], [2.6, -3, 3 * sign, 'run'], [3.2, -1.2, 2.2 * sign, act, 5 * sign], [4.0, -1, 2 * sign, 'run'], [6.0, 8, -4 * sign, 'run'], [8, 14, -4 * sign, 'jog']], true),
    T('D', 'b', 'MARCADOR', [[0, 4, 0, 'jockey'], [2.6, 2.5, 0.3 * sign, 'jockey'], [3.4, 2.4, 0.4 * sign, 'jockey'], [3.9, 2.4, 2 * sign, 'jockey'], [4.4, 2.6, 2.2 * sign, 'jockey'], [6.2, 4.5, -1 * sign, 'run'], [8, 6, -2 * sign, 'idle']]),
  ],
  ball: [carry('A', 0, 8)],
  steps: [{ t: 1.2, text: text[0] }, { t: 3.0, text: text[1] }, { t: 4.2, text: text[2] }, { t: 6.5, text: text[3] }],
  how: text, setup: '1 bola e 1 cone (o marcador). Espaço de 10 x 6 m.',
  tips: ['Cabeça levantada: olhe o marcador, não a bola.', 'A saída é o que vale: primeiros 3 passos curtos e fortes.', 'Treine primeiro devagar, depois com cone, depois com marcação leve.'],
  mistakes: ['Fintar de longe, sem o marcador acreditar.', 'Tocar a bola em linha reta na direção do marcador.', 'Sair devagar depois da finta.'], camera: 'tv',
})

export const REPLAYS: Replay[] = [
  finta('dr_finta', 'Finta de corpo e saída', 'feint', 1, [
    'Conduza em direção ao marcador e dê um toque lateral para atraí-lo.',
    'Apoie o pé no chão para quebrar o ritmo e então finja o lado.',
    'O marcador acreditou: empurre o pé de apoio e saia pelo lado oposto.',
    'Acelere 3 a 5 passos, sem tocar a bola em linha reta no marcador.']),
  finta('dr_pedalada', 'Pedalada', 'pedal', -1, [
    'Aproxime-se do marcador com a bola colada ao pé.',
    'Passe o pé por cima da bola, de dentro para fora, com o corpo baixo.',
    'Com o marcador deslocado, toque com o pé de fora no lado oposto.',
    'Arranque e ganhe a linha de passe ou de chute.']),

  { id: 'dr_corte_dentro', title: 'Corte para dentro e chute', category: 'drible', level: 2, duration: 10, pitch: 'full', focus: { x: 40, y: -8, size: 30 }, goal: { x: 52.5, side: 1 },
    summary: 'Pelo lado de fora, fixe o marcador, corte para dentro e finalize no canto longe.',
    tracks: [
      T('A', 'a', 'VOCÊ', [[0, 22, -26, 'run'], [2.5, 34, -25, 'run'], [3.4, 37.5, -23, 'feint', 20], [4.4, 40, -15, 'run'], [5.4, 44, -8.5, 'run'], [5.8, 45, -7, 'kick', 40], [7.0, 46.5, -5, 'celebrate', 40], [10, 49, -3, 'jog']], true),
      T('D', 'b', 'MARCADOR', [[0, 34, -23, 'jockey'], [2.6, 40, -24, 'jockey'], [3.5, 41, -23.5, 'jockey'], [4.6, 41.5, -19.5, 'run'], [6, 40, -16, 'idle'], [10, 38, -14, 'idle']]),
      T('G', 'b', 'GOLEIRO', [[0, 51.8, 0, 'idle', 180], [5.6, 51.8, -0.3, 'jockey', 180], [6.3, 51.8, 0, 'dive', 180], [7.2, 52, 2.4, 'dive', 180], [8.6, 52, 2.6, 'idle', 180], [10, 52, 2.6, 'idle', 180]]),
    ],
    ball: [carry('A', 0, 5.7), travel(5.8, 7.0, [45.8, -6.6], [53, 3.2], 1.0), at(7.0, 10, [53.4, 3.2])],
    steps: [{ t: 0.5, text: 'Conduza pelo lado de fora, cabeça levantada.' }, { t: 3.2, text: 'Finta de corpo para fora: fixe o marcador.' }, { t: 4.3, text: 'Corte para dentro com a parte de fora do pé.' }, { t: 5.7, text: 'Gire o quadril para o gol e bata com a parte interna.' }, { t: 7.2, text: 'Bola no canto longe, pé de apoio ao lado da bola.' }],
    how: ['Conduza a bola pelo lado de fora, com toques curtos.', 'Finta de corpo para fora para o marcador acreditar.', 'Corte para dentro com a parte de fora do pé.', 'Gire o quadril para o gol, pé de apoio ao lado da bola.', 'Bata com a parte interna, buscando o canto longe.'],
    setup: '1 bola, 2 cones (marcador e linha de corte) e um gol ou 2 cones de trave. Espaço de 20 x 15 m.',
    tips: ['Olhe o gol uma vez antes de bater.', 'Corpo sobre a bola para ela não subir.', 'Primeiro sem goleiro; depois com marcação leve.'], mistakes: ['Cortar para dentro sem a finta (o marcador acompanha).', 'Bater com o corpo para trás: a bola sobe.', 'Pé de apoio longe da bola.'], camera: 'tv' },

  { id: 'dr_giro_sola', title: 'Giro com a sola de costas para o marcador', category: 'drible', level: 2, duration: 8, pitch: 'court', focus: { x: -5, y: 0, size: 15 },
    summary: 'Receba de costas, pare a bola com a sola e gire o corpo para fugir do marcador.',
    tracks: [
      T('A', 'a', 'VOCÊ', [[0, -6, 0, 'receive', 180], [1.9, -6, 0, 'receive', 180], [2.9, -6, 0, 'turn', 10], [3.6, -5.3, -1.6, 'run'], [5.6, 2, -6, 'run'], [8, 8, -7, 'jog']], true),
      T('P', 'a', 'PASSADOR', [[0, -14, 6, 'kick', 0], [1, -14, 6, 'idle', 0], [8, -14, 6, 'idle', 0]]),
      T('D', 'b', 'MARCADOR', [[0, -4.5, 0.5, 'jockey'], [2.0, -4.9, 0.4, 'jockey'], [3.0, -4.9, 0.1, 'jockey'], [3.7, -4.7, -1.4, 'run'], [6, 0.5, -3, 'run'], [8, 3, -4, 'idle']]),
    ],
    ball: [at(0, 0.3, 'P'), travel(0.3, 1.9, [-13.4, 6], 'A', 0.25), carry('A', 1.9, 8)],
    steps: [{ t: 0.4, text: 'Olhe por cima do ombro: onde está o marcador?' }, { t: 1.9, text: 'Pare a bola com a sola, perto do corpo.' }, { t: 2.9, text: 'Gire o corpo pelo lado livre puxando a bola com a sola.' }, { t: 4.2, text: 'Primeiro toque no espaço e acelere.' }],
    how: ['Olhe por cima do ombro antes de a bola chegar.', 'Pare a bola com a sola, protegendo com o corpo.', 'Gire pelo lado livre, puxando a bola com a sola.', 'Saia acelerando para o espaço.'],
    setup: '1 bola, 1 parceiro para passar e 1 cone como marcador. Espaço de 8 x 8 m.', tips: ['Corpo entre a bola e o marcador.', 'Gire rápido: o tempo do giro é o tempo do marcador.', 'Treine nos dois pés.'], mistakes: ['Girar longe da bola.', 'Receber parado e de frente para a bola.', 'Girar para o lado do marcador.'], camera: 'tv' },

  { id: 'dr_marcacao', title: 'Postura de marcação (jockey)', category: 'marcacao', level: 1, duration: 8, pitch: 'court', focus: { x: 0, y: 0, size: 17 },
    summary: 'Fique entre o atacante e o gol, corpo de lado, e empurre o jogo para a linha lateral.',
    tracks: [
      T('M', 'a', 'VOCÊ', [[0, -9, -2, 'jockey'], [2, -5, -1, 'jockey'], [3.5, -1.5, 0, 'jockey'], [5, 1.5, 2, 'jockey'], [6.5, 5, 5.5, 'jockey'], [8, 6.5, 7, 'jockey']], true),
      T('O', 'b', 'ATACANTE', [[0, -12, -1, 'run'], [2, -7, -1.5, 'run'], [3.5, -3, 0.5, 'run'], [5, 0, 3.5, 'run'], [6.5, 4, 7.5, 'run'], [8, 5.6, 9, 'idle']]),
    ],
    ball: [carry('O', 0, 8)],
    steps: [{ t: 0.5, text: 'Fique a 1 ou 2 metros, corpo de lado e base baixa.' }, { t: 2.5, text: 'Acompanhe com passos laterais, sem cruzar os pés.' }, { t: 4.5, text: 'Force o atacante para o lado fraco, rumo à linha lateral.' }, { t: 6.8, text: 'Só desarme quando a bola se afastar do pé dele.' }],
    how: ['Fique entre o atacante e o gol, a 1 ou 2 metros.', 'Corpo de lado e joelhos flexionados.', 'Acompanhe com passos laterais, sem cruzar os pés.', 'Force o atacante para o lado fraco, rumo à linha.', 'Desarme só quando a bola se afastar do pé dele.'],
    setup: '1 bola, 1 parceiro atacando e 2 cones de gol. Espaço de 10 x 8 m.', tips: ['Olhe o quadril e a bola, não os pés.', 'Não pule na finta: espere o toque.', 'Fale com o time: "comigo!"'], mistakes: ['Dar o bote de longe.', 'Cruzar os pés e perder o equilíbrio.', 'Ficar de frente e reto.'], camera: 'seguir' },

  { id: 'dr_desmarque_apoio', title: 'Desmarque de apoio para receber o passe', category: 'desmarque', level: 1, duration: 8, pitch: 'full', focus: { x: 2, y: 4, size: 24 },
    summary: 'Venha em direção à bola em ângulo, fora da sombra do marcador, e devolva de primeira.',
    tracks: [
      T('H', 'a', 'VOCÊ', [[0, 8, 6, 'idle', 180], [1.2, 8, 6, 'feint', 180], [2.0, 9.4, 5.6, 'run'], [3.6, -3, 10, 'run'], [4.0, -3.4, 10, 'receive', 200], [4.7, -3.4, 10, 'kick', 20], [5.3, -3, 10, 'idle', 20], [8, -1, 9, 'jog']], true),
      T('T', 'a', 'COMPANHEIRO', [[0, -10, 3, 'idle', 0], [2.6, -10, 3, 'kick', 20], [3.4, -10, 3, 'idle', 20], [8, -10, 3, 'idle', 20]]),
      T('P', 'b', 'PRESSÃO', [[0, -6.5, 2.5, 'jockey'], [8, -6.5, 2.5, 'jockey']]),
      T('M', 'b', 'MARCADOR', [[0, 10, 5.5, 'jockey'], [1.2, 10.4, 5.2, 'jockey'], [2.4, 8.5, 7.5, 'run'], [3.8, 0, 9.5, 'run'], [5, -0.5, 9.5, 'idle'], [8, -0.5, 9.5, 'idle']]),
      T('F', 'a', 'ATACANTE', [[0, 14, -8, 'idle', 180], [4.4, 14, -8, 'idle', 0], [6.2, 24, -4, 'run'], [8, 30, -2, 'jog']]),
    ],
    ball: [at(0, 0.2, 'T'), carry('T', 0.2, 2.8), travel(2.8, 4.0, 'T', 'H', 0.3), carry('H', 4.0, 4.6), travel(4.7, 6.2, 'H', 'F', 0.2), carry('F', 6.2, 8)],
    steps: [{ t: 0.4, text: 'Olhe por cima do ombro: bola, marcador e espaço.' }, { t: 1.4, text: 'Um passo curto para perto do marcador para empurrá-lo.' }, { t: 2.6, text: 'Venha à bola em diagonal, fora da sombra dele.' }, { t: 4.2, text: 'Receba de lado e devolva de primeira.' }],
    how: ['Olhe por cima do ombro: bola, marcador e espaço.', 'Dê um passo curto para perto do marcador.', 'Venha em direção à bola, em diagonal.', 'Receba de lado e devolva de primeira.'], setup: '1 bola, 3 jogadores e 1 cone de marcador. Espaço de 20 x 15 m.',
    tips: ['Peça a bola com o corpo (braço aberto) e com a voz.', 'Distância de passe de 8 a 15 metros.', 'Depois do passe, mova-se de novo.'], mistakes: ['Ficar parado nas costas do marcador.', 'Vir em linha reta, na sombra do marcador.', 'Receber de frente para a própria baliza.'], camera: 'tv' },

  { id: 'dr_ruptura', title: 'Ruptura nas costas da defesa e finalização', category: 'desmarque', level: 2, duration: 8, pitch: 'full', focus: { x: 34, y: -4, size: 28 }, goal: { x: 52.5, side: 1 },
    summary: 'Finja vir para a bola, saia na diagonal nas costas do zagueiro e finalize.',
    tracks: [
      T('H', 'a', 'VOCÊ', [[0, 22, -4, 'idle', 180], [1.2, 20, -3.4, 'jog'], [1.5, 19.6, -3, 'feint', 190], [2.3, 20, -3.2, 'run'], [3.9, 31, -12, 'run'], [5.0, 38, -9, 'kick', 20], [6.4, 40, -8, 'celebrate'], [8, 42, -7, 'jog']], true),
      T('T', 'a', 'COMPANHEIRO', [[0, 10, 0, 'idle', 0], [2, 10, 0, 'kick', 0], [3, 10, 0, 'idle'], [8, 10, 0, 'idle']]),
      T('D1', 'b', 'ZAGUEIRO', [[0, 28, -8, 'jockey'], [2.4, 27.5, -7.4, 'jockey'], [4.2, 29, -9, 'run'], [8, 30, -9, 'idle']]),
      T('D2', 'b', 'ZAGUEIRO', [[0, 28, 0, 'jockey'], [8, 28.5, 0, 'jockey']]),
      T('D3', 'b', 'ZAGUEIRO', [[0, 28, 8, 'jockey'], [8, 28.5, 8, 'jockey']]),
      T('G', 'b', 'GOLEIRO', [[0, 51.8, 0, 'idle', 180], [4.8, 51.8, -0.5, 'jockey', 180], [5.5, 51.8, 0, 'dive', 180], [6.3, 52, 2, 'dive', 180], [8, 52, 2.2, 'idle', 180]]),
    ],
    ball: [carry('T', 0, 2.0), travel(2.0, 3.9, [10.6, 0], 'H', 0.4), carry('H', 3.9, 4.9), travel(5.1, 6.3, 'H', [53, -2.4], 0.5), at(6.3, 8, [53.4, -2.4])],
    steps: [{ t: 0.6, text: 'Espere o companheiro levantar a cabeça.' }, { t: 1.5, text: 'Finja vir para a bola: o zagueiro sobe.' }, { t: 2.8, text: 'Saia na diagonal, nas costas do zagueiro.' }, { t: 5.0, text: 'Receba em movimento e finalize.' }],
    how: ['Espere o companheiro levantar a cabeça.', 'Finja vir para a bola.', 'Saia na diagonal, nas costas do zagueiro.', 'Receba em movimento e finalize.'], setup: '1 bola, 3 cones (a linha da defesa) e 1 companheiro. Espaço de 30 x 20 m.',
    tips: ['Sair no tempo certo: junto com o passe, não antes.', 'Fique no ombro do zagueiro para não ficar impedido.', 'Chegue com a perna de chute livre.'], mistakes: ['Correr em linha reta de frente para a defesa.', 'Sair antes do companheiro olhar.', 'Perder o tempo da bola.'], camera: 'tv' },

  { id: 'dr_tabela', title: 'Tabela (passa e vai) em 2 contra 1', category: 'desmarque', level: 1, duration: 8, pitch: 'court', focus: { x: 0, y: 2, size: 18 },
    summary: 'Toque e corra para o espaço; receba de volta atrás do marcador.',
    tracks: [
      T('A', 'a', 'VOCÊ', [[0, -14, 0, 'jog'], [2.0, -6, 0.5, 'run', 0], [2.4, -5.4, 0.5, 'kick', 0], [3.0, -4, -1.2, 'run'], [4.4, 4, -3, 'run'], [5.6, 9, -3, 'kick', 0], [8, 12, -3, 'jog']], true),
      T('W', 'a', 'PAREDE', [[0, -4, 8, 'idle', -90], [2.6, -4, 8, 'receive', -90], [3.3, -4, 8, 'kick', -20], [8, -4, 8, 'idle', -20]]),
      T('D', 'b', 'MARCADOR', [[0, -1, 0, 'jockey'], [2.4, -2.4, 0.8, 'jockey'], [3.2, -2.2, 2.6, 'jockey'], [4.4, 0.4, 2.2, 'run'], [8, 3, 1, 'idle']]),
    ],
    ball: [carry('A', 0, 2.4), travel(2.5, 3.0, 'A', 'W', 0.1), at(3.0, 3.3, 'W'), travel(3.35, 4.5, 'W', 'A', 0.1), carry('A', 4.5, 5.5), travel(5.7, 6.8, 'A', [16, 0.5], 0.1), at(6.8, 8, [16, 0.5])],
    steps: [{ t: 1.0, text: 'Conduza até o marcador e atraia a marcação.' }, { t: 2.6, text: 'Passe para a parede e já corra para o espaço.' }, { t: 3.4, text: 'A parede devolve de primeira, nas suas costas.' }, { t: 4.8, text: 'Receba em velocidade e finalize ou passe.' }],
    how: ['Conduza até o marcador e passe para a parede.', 'Corra imediatamente para o espaço atrás do marcador.', 'A parede devolve de primeira.', 'Receba em velocidade e finalize.'], setup: '1 bola, 1 parceiro (parede) e 1 cone de marcador. Espaço de 15 x 10 m.',
    tips: ['Passe e corra: nunca fique olhando.', 'O passe de volta é de primeira.', 'Sinalize com a mão onde quer a bola.'], mistakes: ['Passar e parar.', 'Correr pelo mesmo lado do marcador.', 'Receber de volta em cima do marcador.'], camera: 'tv' },

  { id: 'dr_chute_longe', title: 'Chute de fora da área com a parte interna', category: 'chute', level: 2, duration: 8, pitch: 'full', focus: { x: 38, y: -4, size: 28 }, goal: { x: 52.5, side: 1 },
    summary: 'Domine orientado, ajeite e bata colocado no canto, com o pé de apoio ao lado da bola.',
    tracks: [
      T('A', 'a', 'VOCÊ', [[0, 26, -8, 'run'], [1.8, 29, -5.4, 'receive', 15], [2.7, 29.6, -5, 'run', 20], [3.4, 31, -4.4, 'kick', 10], [4.4, 31.6, -4.2, 'idle', 8], [8, 32, -4, 'idle', 8]], true),
      T('P', 'a', 'PASSADOR', [[0, 14, -14, 'idle', 20], [0.8, 14, -14, 'kick', 20], [2, 14, -14, 'idle', 20], [8, 14, -14, 'idle', 20]]),
      T('D', 'b', 'MARCADOR', [[0, 35, -2, 'jockey'], [2.8, 34, -3.2, 'jockey'], [3.6, 32.8, -3.8, 'run'], [8, 33, -4, 'idle']]),
      T('G', 'b', 'GOLEIRO', [[0, 51.8, 0, 'idle', 180], [3.6, 51.8, 0, 'jockey', 180], [4.4, 51.8, 0, 'dive', 180], [5.3, 52, 2.6, 'dive', 180], [8, 52, 2.8, 'idle', 180]]),
    ],
    ball: [at(0, 0.7, 'P'), travel(0.7, 1.8, [14.5, -13.5], 'A', 0.3), carry('A', 1.8, 3.3), travel(3.5, 5.0, 'A', [53, 3.3], 1.8), at(5.0, 8, [53.4, 3.3])],
    steps: [{ t: 0.8, text: 'Peça a bola em movimento, de lado para o gol.' }, { t: 1.9, text: 'Domine orientado: o primeiro toque já prepara o chute.' }, { t: 3.2, text: 'Pé de apoio ao lado da bola, corpo sobre a bola.' }, { t: 4.2, text: 'Bata com a parte interna, olhando o canto longe.' }],
    how: ['Peça a bola em movimento, de lado para o gol.', 'Domine orientado, já preparando o chute.', 'Pé de apoio ao lado da bola, corpo sobre a bola.', 'Bata com a parte interna, buscando o canto.'], setup: '1 bola, 2 cones de trave e 1 parceiro para passar. Espaço de 25 x 15 m.', tips: ['Pé de apoio firme e apontado para o alvo.', 'Acompanhe o movimento da perna depois de bater.', 'Alvo: o canto longe, rasteiro ou na altura do joelho.'], mistakes: ['Dominar parado e de frente.', 'Corpo para trás: a bola vai para fora.', 'Bater de bico, sem direção.'], camera: 'gol' },

  { id: 'dr_slalom', title: 'Condução em slalom com cones', category: 'conducao', level: 1, duration: 8, pitch: 'court', focus: { x: 0, y: 0, size: 16 }, cones: [[-8, 0], [-4, 0], [0, 0], [4, 0], [8, 0]],
    summary: 'Treino individual: toques curtos, bola colada e cabeça levantada.',
    tracks: [T('A', 'a', 'VOCÊ', [[0, -13, 0, 'jog'], [1.2, -9, -1.3, 'run'], [2.3, -6, 1.3, 'run'], [3.4, -2, -1.3, 'run'], [4.5, 2, 1.3, 'run'], [5.6, 6, -1.3, 'run'], [6.7, 10, 1.3, 'run'], [8, 15, 0, 'jog']], true)],
    ball: [carry('A', 0, 8)],
    steps: [{ t: 0.5, text: 'Toques curtos, bola sempre perto do pé.' }, { t: 3.0, text: 'Use o pé de fora e o de dentro, alternando.' }, { t: 5.5, text: 'Levante a cabeça entre os toques.' }, { t: 7.2, text: 'No fim, acelere e volte contando o tempo.' }],
    how: ['Cinco cones em linha, a 4 passos um do outro.', 'Conduza fazendo o slalom com toques curtos.', 'Alterne pé de dentro e de fora.', 'Levante a cabeça entre os toques.'], setup: '1 bola e 5 cones. Espaço de 22 x 3 m (ou 3 cones em 3x3 m, em casa).', tips: ['Primeiro devagar, depois cronometre.', 'Treine nos dois pés.', 'Marque quantos cones passou sem a bola escapar (0 a 10).'], mistakes: ['Bola longe do pé.', 'Olhar só para a bola.', 'Correr sem controle.'], camera: 'tv' },
]
export const REPLAY_CATS: Record<string, string> = { drible: 'Dribles', marcacao: 'Marcação', desmarque: 'Posicionamento e desmarque', chute: 'Chute', conducao: 'Condução' }
