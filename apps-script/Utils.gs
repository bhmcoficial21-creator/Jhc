/**
 * Funções puras (sem dependência de serviços do Google).
 * Ficam neste arquivo para poderem ser testadas com Node (veja tests/).
 * No Apps Script, todos os arquivos .gs compartilham o mesmo escopo global.
 */

var STATUS = {
  NOVO: 'novo',
  CONTATADO: 'contatado',
  RESPONDEU: 'respondeu',
  INTERESSADO: 'interessado',
  VENDIDO: 'vendido',
  NAO_CONTATAR: 'nao_contatar'
};

var STATUS_LIST = [
  STATUS.NOVO,
  STATUS.CONTATADO,
  STATUS.RESPONDEU,
  STATUS.INTERESSADO,
  STATUS.VENDIDO,
  STATUS.NAO_CONTATAR
];

var PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.types',
  'places.rating',
  'places.userRatingCount',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'nextPageToken'
].join(',');

/** Remove tudo que não for dígito. */
function digitsOnly(value) {
  return String(value == null ? '' : value).replace(/\D/g, '');
}

/**
 * Normaliza um telefone brasileiro.
 * Aceita "(11) 91234-5678", "+55 11 91234-5678", "011 91234-5678" etc.
 * Retorna { national: '11912345678', full: '5511912345678' } ou null se inválido.
 */
function normalizePhoneBR(phone) {
  var d = digitsOnly(phone);
  if (!d) return null;
  // Prefixo internacional 55 (12 ou 13 dígitos no total).
  if ((d.length === 12 || d.length === 13) && d.indexOf('55') === 0) {
    d = d.slice(2);
  }
  // Zero de discagem interurbana (ex.: 011...).
  if ((d.length === 11 || d.length === 12) && d.charAt(0) === '0') {
    d = d.slice(1);
  }
  // DDD (2 dígitos de 1 a 9; não existe DDD terminado em 0) + 8 (fixo) ou 9 (celular) dígitos.
  // Isso também descarta números 0800/0300.
  if (!/^[1-9][1-9](\d{8}|\d{9})$/.test(d)) return null;
  return { national: d, full: '55' + d };
}

/**
 * Heurística: celular brasileiro (DDD + 9 dígitos começando com 9)
 * provavelmente tem WhatsApp. A Places API não informa isso.
 */
function isLikelyWhatsApp(phone) {
  var n = normalizePhoneBR(phone);
  return !!n && /^\d{2}9\d{8}$/.test(n.national);
}

/** Substitui {variavel} pelos valores informados. Variáveis desconhecidas ficam como estão. */
function fillTemplate(template, vars) {
  return String(template || '').replace(/\{(\w+)\}/g, function (match, key) {
    return Object.prototype.hasOwnProperty.call(vars, key) && vars[key] != null
      ? String(vars[key])
      : match;
  });
}

/** Link wa.me com a mensagem codificada. O envio continua sendo manual. */
function buildWhatsAppUrl(phone, message) {
  var n = normalizePhoneBR(phone);
  if (!n) return '';
  var url = 'https://wa.me/' + n.full;
  if (message) url += '?text=' + encodeURIComponent(message);
  return url;
}

/** Link tel: para telefones fixos (ou qualquer número válido). */
function buildTelUrl(phone) {
  var n = normalizePhoneBR(phone);
  return n ? 'tel:+' + n.full : '';
}

/** Link direto para a página de avaliação no Google (para gravar na tag NFC / QR). */
function buildReviewUrl(placeId) {
  return placeId
    ? 'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(placeId)
    : '';
}

/** Monta o textQuery da busca: segmento × bairro. */
function buildTextQuery(segmento, bairro, cidade) {
  var q = String(segmento || '').trim() + ' ' + String(bairro || '').trim();
  if (cidade) q += ', ' + String(cidade).trim();
  return q.trim();
}

/** Lugares sem avaliações (campo ausente) contam como 0. */
function ratingCountOf(place) {
  var n = Number(place && place.userRatingCount);
  return isFinite(n) && n > 0 ? n : 0;
}

/**
 * Mantém apenas lugares com userRatingCount < limite, sem duplicados
 * (pelo place_id) e fora da lista de bloqueados.
 *
 * @param {Object[]} places resultados brutos da API
 * @param {number} limit limite de avaliações (exclusivo)
 * @param {Object} seen mapa place_id -> true; é atualizado (dedupe entre buscas)
 * @param {Object} [blocked] mapa place_id -> true dos "não contatar"
 */
function filterPlaces(places, limit, seen, blocked) {
  var out = [];
  (places || []).forEach(function (p) {
    if (!p || !p.id) return;
    if (seen[p.id]) return;
    if (blocked && blocked[p.id]) return;
    if (ratingCountOf(p) >= limit) return;
    seen[p.id] = true;
    out.push(p);
  });
  return out;
}

/** Converte um resultado da API no objeto de lead usado pela planilha. */
function placeToLead(place, bairro, segmento) {
  var phone = place.internationalPhoneNumber || place.nationalPhoneNumber || '';
  return {
    place_id: place.id,
    nome: (place.displayName && place.displayName.text) || '',
    endereco: place.formattedAddress || '',
    bairro_busca: bairro || '',
    categoria: segmento || '',
    avaliacoes: ratingCountOf(place),
    nota: place.rating != null ? Number(place.rating) : '',
    telefone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
    provavel_whatsapp: isLikelyWhatsApp(phone),
    telefone_normalizado: (normalizePhoneBR(phone) || {}).full || '',
    maps_url: place.googleMapsUri || '',
    site: place.websiteUri || ''
  };
}

/** Escapa aspas para uso dentro de uma string de fórmula do Sheets. */
function escapeFormulaString(s) {
  return String(s == null ? '' : s).replace(/"/g, '""');
}

/** Fórmula =HYPERLINK(url; rótulo). Retorna '' se não houver URL. */
function hyperlinkFormula(url, label) {
  if (!url) return '';
  return '=HYPERLINK("' + escapeFormulaString(url) + '","' + escapeFormulaString(label) + '")';
}

/** Chave do mês (AAAA-MM) para o contador de chamadas da API. */
function monthKey(date) {
  var d = date || new Date();
  var m = d.getMonth() + 1;
  return d.getFullYear() + '-' + (m < 10 ? '0' + m : m);
}

/** Dias inteiros entre duas datas. */
function daysBetween(a, b) {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

// ---------------------------------------------------------------------------
// Painel: leads que chegaram × convertidos
// ---------------------------------------------------------------------------

function startOfDay_(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays_(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function asDate_(v) {
  return v instanceof Date && !isNaN(v.getTime()) ? v : null;
}

function ddmm_(d) {
  var dd = d.getDate(), mm = d.getMonth() + 1;
  return (dd < 10 ? '0' : '') + dd + '/' + (mm < 10 ? '0' : '') + mm;
}

/** Variação percentual arredondada; null quando não há base de comparação. */
function percentChange(atual, anterior) {
  if (!anterior) return null;
  return Math.round(((atual - anterior) / anterior) * 1000) / 10;
}

/**
 * Monta os números do painel.
 *  - "chegaram": leads encontrados pela busca (encontrado_em) no período;
 *  - "convertidos": leads marcados como vendido (data_venda) no período;
 *  - compara com o período anterior de mesmo tamanho;
 *  - barras por dia (até 31 dias) ou por semana (períodos maiores);
 *  - funil com a situação atual de todos os leads.
 *
 * @param {Object[]} leads {status, encontrado_em: Date, data_venda: Date}
 * @param {Date[]} optOutDates datas dos pedidos de "não contatar"
 * @param {number} days tamanho do período em dias
 * @param {Date} now
 */
function buildDashboard(leads, optOutDates, days, now) {
  var bucketDays = days > 31 ? 7 : 1;
  var n = Math.max(1, Math.ceil(days / bucketDays));
  var totalDays = n * bucketDays;
  var end = addDays_(startOfDay_(now), 1); // exclusivo
  var start = addDays_(end, -totalDays);
  var prevStart = addDays_(start, -totalDays);

  var buckets = [];
  for (var i = 0; i < n; i++) {
    var bStart = addDays_(start, i * bucketDays);
    var bEnd = addDays_(bStart, bucketDays - 1);
    buckets.push({
      label: bucketDays === 1 ? ddmm_(bStart) : ddmm_(bStart) + '–' + ddmm_(bEnd),
      chegaram: 0,
      convertidos: 0
    });
  }

  function bucketIndex(d) {
    // Math.round tolera diferenças de horário de verão.
    var diff = Math.round((startOfDay_(d).getTime() - start.getTime()) / 86400000);
    return Math.floor(diff / bucketDays);
  }

  var resumo = { chegaram: 0, chegaramAnterior: 0, convertidos: 0, convertidosAnterior: 0 };
  function count(d, campo) {
    d = asDate_(d);
    if (!d) return;
    if (d >= start && d < end) {
      resumo[campo]++;
      buckets[bucketIndex(d)][campo]++;
    } else if (d >= prevStart && d < start) {
      resumo[campo + 'Anterior']++;
    }
  }

  var funil = {};
  STATUS_LIST.forEach(function (s) { funil[s] = 0; });

  (leads || []).forEach(function (l) {
    count(l.encontrado_em, 'chegaram');
    if (l.status === STATUS.VENDIDO) count(l.data_venda, 'convertidos');
    if (funil.hasOwnProperty(l.status)) funil[l.status]++;
  });
  // Quem pediu para sair é apagado da aba Leads; contamos pela aba "Nao contatar".
  funil[STATUS.NAO_CONTATAR] = (optOutDates || []).length;

  var total = 0;
  STATUS_LIST.forEach(function (s) { total += funil[s]; });

  return {
    dias: totalDays,
    porSemana: bucketDays === 7,
    inicio: ddmm_(start),
    fim: ddmm_(addDays_(end, -1)),
    chegaram: resumo.chegaram,
    convertidos: resumo.convertidos,
    variacaoChegaram: percentChange(resumo.chegaram, resumo.chegaramAnterior),
    variacaoConvertidos: percentChange(resumo.convertidos, resumo.convertidosAnterior),
    taxaPeriodo: resumo.chegaram ? Math.round(resumo.convertidos / resumo.chegaram * 1000) / 10 : null,
    buckets: buckets,
    funil: funil,
    total: total,
    taxaGeral: total ? Math.round(funil[STATUS.VENDIDO] / total * 1000) / 10 : null
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STATUS: STATUS,
    STATUS_LIST: STATUS_LIST,
    PLACES_FIELD_MASK: PLACES_FIELD_MASK,
    digitsOnly: digitsOnly,
    normalizePhoneBR: normalizePhoneBR,
    isLikelyWhatsApp: isLikelyWhatsApp,
    fillTemplate: fillTemplate,
    buildWhatsAppUrl: buildWhatsAppUrl,
    buildTelUrl: buildTelUrl,
    buildReviewUrl: buildReviewUrl,
    buildTextQuery: buildTextQuery,
    ratingCountOf: ratingCountOf,
    filterPlaces: filterPlaces,
    placeToLead: placeToLead,
    escapeFormulaString: escapeFormulaString,
    hyperlinkFormula: hyperlinkFormula,
    monthKey: monthKey,
    daysBetween: daysBetween,
    percentChange: percentChange,
    buildDashboard: buildDashboard
  };
}
