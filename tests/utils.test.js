const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');

// Utils.gs é JavaScript puro; carregamos como módulo CommonJS.
const file = path.join(__dirname, '..', 'apps-script', 'Utils.gs');
const m = new Module(file);
m.filename = file;
m._compile(fs.readFileSync(file, 'utf8'), file);
const U = m.exports;

test('normalizePhoneBR aceita formatos comuns', () => {
  assert.deepEqual(U.normalizePhoneBR('(11) 91234-5678'), { national: '11912345678', full: '5511912345678' });
  assert.deepEqual(U.normalizePhoneBR('+55 11 91234-5678'), { national: '11912345678', full: '5511912345678' });
  assert.deepEqual(U.normalizePhoneBR('011 3711-1234'), { national: '1137111234', full: '551137111234' });
  assert.deepEqual(U.normalizePhoneBR('+55 11 3711-1234'), { national: '1137111234', full: '551137111234' });
  assert.equal(U.normalizePhoneBR(''), null);
  assert.equal(U.normalizePhoneBR(null), null);
  assert.equal(U.normalizePhoneBR('0800 123 4567'), null);
  assert.equal(U.normalizePhoneBR('1234'), null);
});

test('isLikelyWhatsApp: só celular (9 dígitos começando com 9)', () => {
  assert.equal(U.isLikelyWhatsApp('(11) 91234-5678'), true);
  assert.equal(U.isLikelyWhatsApp('+55 11 98765-4321'), true);
  assert.equal(U.isLikelyWhatsApp('(11) 3711-1234'), false);
  assert.equal(U.isLikelyWhatsApp(''), false);
});

test('buildWhatsAppUrl codifica a mensagem', () => {
  const url = U.buildWhatsAppUrl('(11) 91234-5678', 'Olá, "Pizzaria" & cia?');
  assert.equal(url, 'https://wa.me/5511912345678?text=' + encodeURIComponent('Olá, "Pizzaria" & cia?'));
  assert.ok(!url.includes('"'));
  assert.equal(U.buildWhatsAppUrl('123', 'oi'), '');
});

test('buildTelUrl', () => {
  assert.equal(U.buildTelUrl('(11) 3711-1234'), 'tel:+551137111234');
  assert.equal(U.buildTelUrl(''), '');
});

test('fillTemplate substitui variáveis conhecidas', () => {
  const s = U.fillTemplate('Oi {nome}, {avaliacoes} avaliações no {bairro}. {x}', {
    nome: 'Barbearia do Zé', avaliacoes: 12, bairro: 'Rio Pequeno'
  });
  assert.equal(s, 'Oi Barbearia do Zé, 12 avaliações no Rio Pequeno. {x}');
  assert.equal(U.fillTemplate('{avaliacoes}', { avaliacoes: 0 }), '0');
});

test('buildReviewUrl', () => {
  assert.equal(U.buildReviewUrl('ChIJabc123'),
    'https://search.google.com/local/writereview?placeid=ChIJabc123');
  assert.equal(U.buildReviewUrl(''), '');
});

test('buildTextQuery: segmento × bairro', () => {
  assert.equal(U.buildTextQuery('barbearia', 'Rio Pequeno', 'São Paulo'), 'barbearia Rio Pequeno, São Paulo');
  assert.equal(U.buildTextQuery('barbearia', 'Rio Pequeno', ''), 'barbearia Rio Pequeno');
});

test('filterPlaces: limite, ausência = 0, duplicados e bloqueados', () => {
  const seen = {};
  const blocked = { B: true };
  const first = U.filterPlaces([
    { id: 'A', userRatingCount: 10 },
    { id: 'B', userRatingCount: 3 },   // bloqueado
    { id: 'C', userRatingCount: 50 },  // no limite: fora
    { id: 'D' },                       // sem avaliações: conta como 0
    { id: 'A', userRatingCount: 10 },  // duplicado na mesma página
    { userRatingCount: 1 }             // sem id
  ], 50, seen, blocked);
  assert.deepEqual(first.map(p => p.id), ['A', 'D']);

  // Bairro vizinho devolve o mesmo lugar: não duplica.
  const second = U.filterPlaces([{ id: 'A', userRatingCount: 10 }, { id: 'E', userRatingCount: 49 }], 50, seen, blocked);
  assert.deepEqual(second.map(p => p.id), ['E']);
  assert.deepEqual(U.filterPlaces(undefined, 50, seen), []);
});

test('placeToLead', () => {
  const lead = U.placeToLead({
    id: 'X1',
    displayName: { text: 'Salão Bela', languageCode: 'pt' },
    formattedAddress: 'R. A, 1 - Rio Pequeno, São Paulo - SP',
    rating: 4.7,
    nationalPhoneNumber: '(11) 91234-5678',
    internationalPhoneNumber: '+55 11 91234-5678',
    googleMapsUri: 'https://maps.google.com/?cid=1',
    websiteUri: 'https://bela.example'
  }, 'Rio Pequeno', 'salão de beleza');
  assert.equal(lead.place_id, 'X1');
  assert.equal(lead.nome, 'Salão Bela');
  assert.equal(lead.avaliacoes, 0);
  assert.equal(lead.nota, 4.7);
  assert.equal(lead.telefone, '(11) 91234-5678');
  assert.equal(lead.provavel_whatsapp, true);
  assert.equal(lead.telefone_normalizado, '5511912345678');
  assert.equal(lead.bairro_busca, 'Rio Pequeno');
  assert.equal(lead.categoria, 'salão de beleza');

  const semFone = U.placeToLead({ id: 'X2', userRatingCount: 7 }, 'Jaguaré', 'pizzaria');
  assert.equal(semFone.telefone, '');
  assert.equal(semFone.provavel_whatsapp, false);
  assert.equal(semFone.nota, '');
});

test('hyperlinkFormula escapa aspas', () => {
  assert.equal(U.hyperlinkFormula('https://x.com/?a="b"', 'Ver "isso"'),
    '=HYPERLINK("https://x.com/?a=""b""","Ver ""isso""")');
  assert.equal(U.hyperlinkFormula('', 'x'), '');
});

test('monthKey e daysBetween', () => {
  assert.equal(U.monthKey(new Date(2026, 0, 15)), '2026-01');
  assert.equal(U.monthKey(new Date(2026, 10, 4)), '2026-11');
  assert.equal(U.daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 31)), 30);
});
