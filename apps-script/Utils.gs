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
    daysBetween: daysBetween
  };
}
