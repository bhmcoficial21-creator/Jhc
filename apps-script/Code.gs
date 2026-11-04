/**
 * Prospecção de clientes para plaquinhas NFC de avaliação Google (MVP).
 *
 * Planilha Google + Apps Script:
 *  - busca estabelecimentos na Places API (New) Text Search, segmento × bairro;
 *  - mantém só quem tem menos de N avaliações, sem duplicados;
 *  - grava na aba "Leads" com links de WhatsApp / ligar / Maps;
 *  - o ENVIO da mensagem é sempre manual (o usuário abre o link e toca em enviar);
 *  - status "nao_contatar" remove o lead da lista e bloqueia o place_id para sempre.
 *
 * A chave da API fica em PropertiesService (menu Prospecção > Configurar chave da API).
 */

var SHEET_CONFIG = 'Config';
var SHEET_LEADS = 'Leads';
var SHEET_BLOCKED = 'Nao contatar';

var API_KEY_PROPERTY = 'PLACES_API_KEY';
var CALLS_PROPERTY_PREFIX = 'places_calls_';

var LEADS_BANNER_ROW = 1; // atribuição ao Google
var LEADS_HEADER_ROW = 2;
var LEADS_FIRST_DATA_ROW = 3;

var LEADS_HEADERS = [
  'place_id',            // 1
  'nome',                // 2
  'endereco',            // 3
  'bairro_busca',        // 4
  'categoria',           // 5
  'avaliacoes',          // 6
  'nota',                // 7
  'telefone',            // 8
  'provavel_whatsapp',   // 9
  'contato',             // 10 (fórmula: WhatsApp ou Ligar)
  'maps',                // 11 (fórmula)
  'site',                // 12
  'status',              // 13
  'data_ultimo_contato', // 14
  'observacoes',         // 15
  'link_avaliacao',      // 16 (fórmula, preenchido quando vendido)
  'avaliacoes_na_venda', // 17 (para comparar antes/depois)
  'atualizado_em'        // 18 (última vez que os dados do Google foram atualizados)
];

var COL = {};
LEADS_HEADERS.forEach(function (h, i) { COL[h] = i + 1; });

/** Colunas com conteúdo vindo da Places API (limpas pela rotina de limpeza). */
var GOOGLE_CONTENT_COLS = ['nome', 'endereco', 'avaliacoes', 'nota', 'telefone',
  'provavel_whatsapp', 'site'];

var DEFAULT_MESSAGE =
  'Olá, tudo bem? Meu nome é {seu_nome}, sou aqui da região do Rio Pequeno. ' +
  'Vi a {nome} no Google Maps e trabalho com plaquinhas NFC: o cliente encosta o celular ' +
  'e já abre a página de avaliação de vocês no Google. Posso te mostrar como funciona? ' +
  'Se preferir não receber mensagens, é só me avisar.';

var CONFIG_PARAMS = [
  ['Cidade', 'São Paulo - SP'],
  ['Limite de avaliações (menor que)', 50],
  ['Máx. páginas por busca (20 resultados cada)', 3],
  ['Máx. chamadas da API por execução', 60],
  ['Limite mensal de chamadas da API', 900],
  ['Seu nome', '[SEU NOME]'],
  ['Mensagem do WhatsApp', DEFAULT_MESSAGE],
  ['Dias para limpar dados do Google', 30]
];

var DEFAULT_BAIRROS = ['Rio Pequeno', 'Jaguaré', 'Jardim Bonfiglioli', 'Vila São Francisco'];
var DEFAULT_SEGMENTOS = ['salão de beleza', 'barbearia', 'pizzaria', 'restaurante', 'loja'];

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Prospecção')
    .addItem('1. Preparar planilha', 'prepararPlanilha')
    .addItem('2. Configurar chave da API', 'configurarChaveApi')
    .addSeparator()
    .addItem('Buscar leads', 'buscarLeads')
    .addItem('Atualizar detalhes dos leads selecionados', 'atualizarSelecionados')
    .addItem('Regerar links (após mudar a mensagem)', 'regerarLinks')
    .addSeparator()
    .addItem('Aplicar "não contatar"', 'aplicarNaoContatar')
    .addItem('Limpar dados antigos do Google', 'limparDadosAntigos')
    .addItem('Ver uso da API no mês', 'verUsoApi')
    .addToUi();
}

// ---------------------------------------------------------------------------
// Preparação
// ---------------------------------------------------------------------------

function prepararPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var cfg = ss.getSheetByName(SHEET_CONFIG);
  if (!cfg) {
    cfg = ss.insertSheet(SHEET_CONFIG);
    cfg.getRange(1, 1, 1, 5).setValues([['Bairros', 'Segmentos', '', 'Parâmetro', 'Valor']])
      .setFontWeight('bold');
    cfg.getRange(2, 1, DEFAULT_BAIRROS.length, 1)
      .setValues(DEFAULT_BAIRROS.map(function (b) { return [b]; }));
    cfg.getRange(2, 2, DEFAULT_SEGMENTOS.length, 1)
      .setValues(DEFAULT_SEGMENTOS.map(function (s) { return [s]; }));
    cfg.getRange(2, 4, CONFIG_PARAMS.length, 2).setValues(CONFIG_PARAMS);
    cfg.getRange(2, 5, CONFIG_PARAMS.length, 1).setWrap(true);
    cfg.setColumnWidth(1, 180);
    cfg.setColumnWidth(2, 180);
    cfg.setColumnWidth(4, 300);
    cfg.setColumnWidth(5, 420);
    cfg.setFrozenRows(1);
  }

  ensureLeadsSheet_();
  ensureBlockedSheet_();

  SpreadsheetApp.getUi().alert(
    'Planilha pronta.\n\n' +
    '• Ajuste bairros, segmentos e parâmetros na aba "Config" (troque [SEU NOME]).\n' +
    '• Depois use Prospecção > Configurar chave da API.\n' +
    '• Configure orçamento e alertas de gasto no Google Cloud.');
}

function ensureLeadsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_LEADS);
  if (sh) return sh;

  sh = ss.insertSheet(SHEET_LEADS);
  sh.getRange(LEADS_BANNER_ROW, 1)
    .setValue('Dados de estabelecimentos: Google Maps. ' +
      'O envio das mensagens é manual: revise e toque em enviar, uma conversa por vez.')
    .setFontStyle('italic');
  sh.getRange(LEADS_HEADER_ROW, 1, 1, LEADS_HEADERS.length)
    .setValues([LEADS_HEADERS]).setFontWeight('bold').setBackground('#e8f0fe');
  sh.setFrozenRows(LEADS_HEADER_ROW);
  sh.hideColumns(COL.place_id);
  applyStatusValidation_(sh);
  return sh;
}

function ensureBlockedSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_BLOCKED);
  if (sh) return sh;
  sh = ss.insertSheet(SHEET_BLOCKED);
  sh.getRange(1, 1, 1, 2).setValues([['place_id', 'data_pedido']]).setFontWeight('bold');
  sh.setFrozenRows(1);
  // Guardamos só o place_id (permitido pelos termos) e a data do pedido de saída.
  return sh;
}

function applyStatusValidation_(sh) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_LIST, true)
    .setAllowInvalid(false)
    .build();
  sh.getRange(LEADS_FIRST_DATA_ROW, COL.status, sh.getMaxRows() - LEADS_HEADER_ROW, 1)
    .setDataValidation(rule);
  sh.getRange(LEADS_FIRST_DATA_ROW, COL.data_ultimo_contato,
    sh.getMaxRows() - LEADS_HEADER_ROW, 1).setNumberFormat('dd/mm/yyyy');
  sh.getRange(LEADS_FIRST_DATA_ROW, COL.atualizado_em,
    sh.getMaxRows() - LEADS_HEADER_ROW, 1).setNumberFormat('dd/mm/yyyy');
}

function configurarChaveApi() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt('Chave da Places API (New)',
    'Cole a chave. Ela fica salva nas propriedades do script, não na planilha.\n' +
    'Restrinja a chave no Google Cloud para usar só a "Places API (New)".',
    ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var key = resp.getResponseText().trim();
  if (!key) { ui.alert('Nenhuma chave informada.'); return; }
  PropertiesService.getScriptProperties().setProperty(API_KEY_PROPERTY, key);
  ui.alert('Chave salva.');
}

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

function readConfig_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG);
  if (!sh) throw new Error('Aba "Config" não encontrada. Use Prospecção > Preparar planilha.');
  var last = Math.max(sh.getLastRow(), 2);
  var values = sh.getRange(2, 1, last - 1, 5).getValues();

  var params = {};
  values.forEach(function (r) { if (r[3]) params[String(r[3]).trim()] = r[4]; });

  function list(col) {
    return values.map(function (r) { return String(r[col]).trim(); })
      .filter(function (v) { return v; });
  }
  function num(label, def) {
    var n = Number(params[label]);
    return isFinite(n) && n > 0 ? n : def;
  }

  return {
    bairros: list(0),
    segmentos: list(1),
    cidade: String(params['Cidade'] || ''),
    limite: num('Limite de avaliações (menor que)', 50),
    maxPaginas: num('Máx. páginas por busca (20 resultados cada)', 3),
    maxChamadasExecucao: num('Máx. chamadas da API por execução', 60),
    maxChamadasMes: num('Limite mensal de chamadas da API', 900),
    seuNome: String(params['Seu nome'] || ''),
    mensagem: String(params['Mensagem do WhatsApp'] || DEFAULT_MESSAGE),
    diasLimpeza: num('Dias para limpar dados do Google', 30)
  };
}

function getApiKey_() {
  var key = PropertiesService.getScriptProperties().getProperty(API_KEY_PROPERTY);
  if (!key) throw new Error('Chave da API não configurada. Use Prospecção > Configurar chave da API.');
  return key;
}

// ---------------------------------------------------------------------------
// Contador de chamadas (proteção de custo)
// ---------------------------------------------------------------------------

function getMonthlyCalls_() {
  var v = PropertiesService.getScriptProperties().getProperty(CALLS_PROPERTY_PREFIX + monthKey());
  return Number(v) || 0;
}

function addMonthlyCall_() {
  var props = PropertiesService.getScriptProperties();
  var k = CALLS_PROPERTY_PREFIX + monthKey();
  props.setProperty(k, String((Number(props.getProperty(k)) || 0) + 1));
}

function verUsoApi() {
  var cfg = readConfig_();
  SpreadsheetApp.getUi().alert(
    'Chamadas da Places API neste mês (' + monthKey() + '): ' + getMonthlyCalls_() +
    '\nLimite configurado: ' + cfg.maxChamadasMes +
    '\n\nEste contador é só desta planilha. Confira o painel de faturamento do Google Cloud.');
}

// ---------------------------------------------------------------------------
// Places API (New)
// ---------------------------------------------------------------------------

function textSearch_(apiKey, query, pageToken) {
  var body = { textQuery: query, languageCode: 'pt-BR', regionCode: 'BR', pageSize: 20 };
  if (pageToken) body.pageToken = pageToken;
  var resp = UrlFetchApp.fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': PLACES_FIELD_MASK },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  addMonthlyCall_();
  return parseApiResponse_(resp);
}

function placeDetails_(apiKey, placeId) {
  var mask = PLACES_FIELD_MASK.split(',')
    .filter(function (f) { return f.indexOf('places.') === 0; })
    .map(function (f) { return f.slice('places.'.length); })
    .join(',');
  var resp = UrlFetchApp.fetch(
    'https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId) + '?languageCode=pt-BR', {
      method: 'get',
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': mask },
      muteHttpExceptions: true
    });
  addMonthlyCall_();
  return parseApiResponse_(resp);
}

function parseApiResponse_(resp) {
  var code = resp.getResponseCode();
  var text = resp.getContentText();
  if (code !== 200) {
    var msg = text;
    try { msg = JSON.parse(text).error.message; } catch (e) { /* mantém texto bruto */ }
    throw new Error('Places API respondeu ' + code + ': ' + msg);
  }
  return JSON.parse(text || '{}');
}

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

function buscarLeads() {
  var cfg = readConfig_();
  var apiKey = getApiKey_();
  if (!cfg.bairros.length || !cfg.segmentos.length) {
    throw new Error('Informe ao menos um bairro e um segmento na aba "Config".');
  }

  var blocked = readBlockedIds_();
  var seen = {};
  var leads = [];
  var chamadas = 0;
  var interrompido = '';

  outer:
  for (var i = 0; i < cfg.bairros.length; i++) {
    for (var j = 0; j < cfg.segmentos.length; j++) {
      var bairro = cfg.bairros[i];
      var segmento = cfg.segmentos[j];
      var query = buildTextQuery(segmento, bairro, cfg.cidade);
      var token = null;
      var paginas = 0;
      do {
        if (chamadas >= cfg.maxChamadasExecucao) {
          interrompido = 'limite de chamadas por execução'; break outer;
        }
        if (getMonthlyCalls_() >= cfg.maxChamadasMes) {
          interrompido = 'limite mensal de chamadas'; break outer;
        }
        var data = textSearch_(apiKey, query, token);
        chamadas++;
        paginas++;
        filterPlaces(data.places, cfg.limite, seen, blocked).forEach(function (p) {
          leads.push(placeToLead(p, bairro, segmento));
        });
        token = data.nextPageToken;
      } while (token && paginas < cfg.maxPaginas);
    }
  }

  var r = upsertLeads_(leads, cfg);
  SpreadsheetApp.getUi().alert(
    'Busca concluída.\n\n' +
    'Chamadas da API: ' + chamadas + ' (mês: ' + getMonthlyCalls_() + ')\n' +
    'Leads com menos de ' + cfg.limite + ' avaliações: ' + leads.length + '\n' +
    'Novos: ' + r.novos + ' | Atualizados: ' + r.atualizados +
    (interrompido ? '\n\nBusca interrompida: ' + interrompido + '.' : ''));
}

/**
 * Atualiza (via Place Details) só as linhas selecionadas na aba Leads.
 * Útil depois da limpeza de dados antigos, sem refazer todas as buscas.
 */
function atualizarSelecionados() {
  var cfg = readConfig_();
  var apiKey = getApiKey_();
  var sh = SpreadsheetApp.getActiveSheet();
  var range = SpreadsheetApp.getActiveRange();
  if (!range || sh.getName() !== SHEET_LEADS) {
    throw new Error('Selecione linhas na aba "Leads".');
  }
  var first = Math.max(range.getRow(), LEADS_FIRST_DATA_ROW);
  var last = Math.min(range.getLastRow(), sh.getLastRow());
  if (last < first) return;

  var rows = sh.getRange(first, 1, last - first + 1, LEADS_HEADERS.length).getValues();
  var leads = [];
  for (var i = 0; i < rows.length; i++) {
    if (getMonthlyCalls_() >= cfg.maxChamadasMes) break;
    var id = rows[i][COL.place_id - 1];
    if (!id) continue;
    var place = placeDetails_(apiKey, id);
    leads.push(placeToLead(place, rows[i][COL.bairro_busca - 1], rows[i][COL.categoria - 1]));
  }
  var r = upsertLeads_(leads, cfg);
  SpreadsheetApp.getActiveSpreadsheet().toast(r.atualizados + ' lead(s) atualizado(s).', 'Prospecção');
}

// ---------------------------------------------------------------------------
// Escrita na aba Leads
// ---------------------------------------------------------------------------

function readLeadRows_(sh) {
  var n = sh.getLastRow() - LEADS_HEADER_ROW;
  if (n <= 0) return [];
  return sh.getRange(LEADS_FIRST_DATA_ROW, 1, n, LEADS_HEADERS.length).getValues();
}

/**
 * Insere/atualiza leads preservando os dados do usuário (status, datas, observações).
 * Reescreve o bloco inteiro porque as colunas de link são fórmulas recalculadas.
 */
function upsertLeads_(leads, cfg) {
  var sh = ensureLeadsSheet_();
  var rows = readLeadRows_(sh);
  var index = {};
  rows.forEach(function (r, i) { if (r[0]) index[r[0]] = i; });

  var novos = 0, atualizados = 0;
  var agora = new Date();

  leads.forEach(function (lead) {
    var row;
    if (index.hasOwnProperty(lead.place_id)) {
      row = rows[index[lead.place_id]];
      atualizados++;
    } else {
      row = LEADS_HEADERS.map(function () { return ''; });
      row[COL.place_id - 1] = lead.place_id;
      row[COL.bairro_busca - 1] = lead.bairro_busca;
      row[COL.categoria - 1] = lead.categoria;
      row[COL.status - 1] = STATUS.NOVO;
      index[lead.place_id] = rows.length;
      rows.push(row);
      novos++;
    }
    row[COL.nome - 1] = lead.nome;
    row[COL.endereco - 1] = lead.endereco;
    row[COL.avaliacoes - 1] = lead.avaliacoes;
    row[COL.nota - 1] = lead.nota;
    row[COL.telefone - 1] = lead.telefone;
    row[COL.provavel_whatsapp - 1] = lead.provavel_whatsapp ? 'sim' : 'não';
    row[COL.site - 1] = lead.site;
    row[COL.maps - 1] = lead.maps_url; // vira fórmula em applyFormulas_
    row[COL.atualizado_em - 1] = agora;
  });

  writeRows_(sh, rows, cfg);
  return { novos: novos, atualizados: atualizados };
}

/** Calcula as colunas de fórmula (contato, maps, link de avaliação) de uma linha. */
function applyFormulas_(row, cfg) {
  var id = row[COL.place_id - 1];
  var tel = row[COL.telefone - 1];
  var nome = row[COL.nome - 1];

  var contato = '';
  if (tel && isLikelyWhatsApp(tel)) {
    var msg = fillTemplate(cfg.mensagem, {
      nome: nome,
      avaliacoes: row[COL.avaliacoes - 1],
      bairro: row[COL.bairro_busca - 1],
      seu_nome: cfg.seuNome
    });
    contato = hyperlinkFormula(buildWhatsAppUrl(tel, msg), 'WhatsApp');
  } else if (tel) {
    contato = hyperlinkFormula(buildTelUrl(tel), 'Ligar');
  }
  row[COL.contato - 1] = contato;

  // Link do Maps: usa o googleMapsUri se ainda estiver guardado; senão monta a partir do place_id.
  var mapsCell = row[COL.maps - 1];
  var mapsUrl = /^https?:\/\//.test(String(mapsCell)) ? mapsCell
    : (id ? 'https://www.google.com/maps/place/?q=place_id:' + encodeURIComponent(id) : '');
  row[COL.maps - 1] = hyperlinkFormula(mapsUrl, 'Maps');

  row[COL.link_avaliacao - 1] = row[COL.status - 1] === STATUS.VENDIDO
    ? hyperlinkFormula(buildReviewUrl(id), buildReviewUrl(id))
    : '';
}

function writeRows_(sh, rows, cfg) {
  if (!rows.length) return;
  // Ao ler com getValues, células com fórmula voltam como o texto exibido ("Maps").
  // Recuperamos as URLs reais das fórmulas existentes antes de recalcular.
  var existingCount = sh.getLastRow() - LEADS_HEADER_ROW;
  if (existingCount > 0) {
    var formulas = sh.getRange(LEADS_FIRST_DATA_ROW, COL.maps, existingCount, 1).getFormulas();
    for (var i = 0; i < existingCount && i < rows.length; i++) {
      // Só recupera se a célula ainda mostra o rótulo da fórmula; '' = limpo, URL = nova da API.
      if (rows[i][COL.maps - 1] !== 'Maps') continue;
      var m = /HYPERLINK\("((?:[^"]|"")*)"/.exec(formulas[i][0] || '');
      rows[i][COL.maps - 1] = m ? m[1].replace(/""/g, '"') : '';
    }
  }
  rows.forEach(function (r) { applyFormulas_(r, cfg); });

  if (sh.getMaxRows() < LEADS_HEADER_ROW + rows.length) {
    sh.insertRowsAfter(sh.getMaxRows(), LEADS_HEADER_ROW + rows.length - sh.getMaxRows());
    applyStatusValidation_(sh);
  }
  sh.getRange(LEADS_FIRST_DATA_ROW, 1, rows.length, LEADS_HEADERS.length).setValues(rows);
}

function regerarLinks() {
  var cfg = readConfig_();
  var sh = ensureLeadsSheet_();
  writeRows_(sh, readLeadRows_(sh), cfg);
  SpreadsheetApp.getActiveSpreadsheet().toast('Links atualizados.', 'Prospecção');
}

// ---------------------------------------------------------------------------
// Não contatar
// ---------------------------------------------------------------------------

function readBlockedIds_() {
  var sh = ensureBlockedSheet_();
  var map = {};
  if (sh.getLastRow() < 2) return map;
  sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues()
    .forEach(function (r) { if (r[0]) map[r[0]] = true; });
  return map;
}

/**
 * Move para a aba "Nao contatar" (só place_id + data) todas as linhas com status nao_contatar
 * e as apaga da aba Leads. Esses lugares nunca mais voltam nas buscas.
 */
function aplicarNaoContatar() {
  var sh = ensureLeadsSheet_();
  var rows = readLeadRows_(sh);
  var blockedSh = ensureBlockedSheet_();
  var blocked = readBlockedIds_();
  var removidos = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    if (rows[i][COL.status - 1] !== STATUS.NAO_CONTATAR) continue;
    var id = rows[i][COL.place_id - 1];
    if (id && !blocked[id]) {
      blockedSh.appendRow([id, new Date()]);
      blocked[id] = true;
    }
    sh.deleteRow(LEADS_FIRST_DATA_ROW + i);
    removidos++;
  }
  if (removidos) {
    SpreadsheetApp.getActiveSpreadsheet().toast(removidos + ' lead(s) movido(s) para "não contatar".',
      'Prospecção');
  }
}

/**
 * Gatilho simples: reage à mudança de status na aba Leads.
 *  - nao_contatar: remove a linha e bloqueia o place_id;
 *  - vendido: gera o link de avaliação e guarda a quantidade de avaliações no momento da venda;
 *  - outros status (exceto novo): registra hoje como data do último contato.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getName() !== SHEET_LEADS) return;
  var c1 = e.range.getColumn(), c2 = e.range.getLastColumn();
  if (COL.status < c1 || COL.status > c2) return;

  var r1 = Math.max(e.range.getRow(), LEADS_FIRST_DATA_ROW);
  var r2 = e.range.getLastRow();
  if (r2 < r1) return;

  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  var precisaBloquear = false;

  for (var r = r1; r <= r2; r++) {
    var row = sh.getRange(r, 1, 1, LEADS_HEADERS.length).getValues()[0];
    var status = row[COL.status - 1];
    if (status === STATUS.NAO_CONTATAR) { precisaBloquear = true; continue; }

    if (status && status !== STATUS.NOVO) {
      sh.getRange(r, COL.data_ultimo_contato).setValue(hoje);
    }
    if (status === STATUS.VENDIDO) {
      var url = buildReviewUrl(row[COL.place_id - 1]);
      sh.getRange(r, COL.link_avaliacao).setFormula(hyperlinkFormula(url, url));
      if (row[COL.avaliacoes_na_venda - 1] === '') {
        sh.getRange(r, COL.avaliacoes_na_venda).setValue(row[COL.avaliacoes - 1]);
      }
    } else {
      sh.getRange(r, COL.link_avaliacao).clearContent();
    }
  }
  if (precisaBloquear) aplicarNaoContatar();
}

// ---------------------------------------------------------------------------
// Limpeza (termos da Google Maps Platform)
// ---------------------------------------------------------------------------

/**
 * Apaga o conteúdo vindo do Google das linhas não atualizadas há mais de N dias.
 * Mantém place_id (pode ser guardado) e os dados próprios do usuário.
 * Para ver os dados de novo: selecione as linhas e use "Atualizar detalhes dos leads selecionados".
 */
function limparDadosAntigos() {
  var cfg = readConfig_();
  var sh = ensureLeadsSheet_();
  var rows = readLeadRows_(sh);
  var agora = new Date();
  var limpos = 0;
  rows.forEach(function (row) {
    var upd = row[COL.atualizado_em - 1];
    if (!(upd instanceof Date) || daysBetween(upd, agora) <= cfg.diasLimpeza) return;
    GOOGLE_CONTENT_COLS.forEach(function (h) { row[COL[h] - 1] = ''; });
    row[COL.maps - 1] = ''; // será refeito a partir do place_id
    row[COL.atualizado_em - 1] = '';
    limpos++;
  });
  if (limpos) writeRows_(sh, rows, cfg);
  SpreadsheetApp.getActiveSpreadsheet().toast(limpos + ' linha(s) limpa(s).', 'Prospecção');
}
