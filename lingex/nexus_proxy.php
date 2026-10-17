<?php
// ============================================================
// LINGEX — ponte para a IA (Nexus) funcionar fora do claude.ai
// ============================================================
// O QUE ISSO FAZ:
// Recebe a pergunta mandada pelo app, chama a API da Anthropic
// com a SUA chave (que fica só aqui no servidor, nunca aparece
// no navegador de quem usa o site) e devolve a resposta pro app.
//
// COMO INSTALAR:
// 1. Pegue sua chave de API em console.anthropic.com
//    (menu "API Keys" > "Create Key"). Ela começa com "sk-ant-".
// 2. Troque o valor de ANTHROPIC_API_KEY abaixo pela sua chave.
// 3. Suba este arquivo pro Hostinger (Gerenciador de Arquivos),
//    na MESMA pasta do index.html (public_html), com o nome
//    exato: nexus_proxy.php — não mude o nome.
// 4. Pronto. O app já está programado pra chamar esse arquivo.
//
// CUSTO: cada pergunta que alguém fizer na Nexus chama a API da
// Anthropic de verdade e gera um custo pequeno (poucos centavos
// de dólar por pergunta, geralmente bem menos que 1 centavo).
// Isso é cobrado da sua conta Anthropic, não da Cakto nem do
// Hostinger. Acompanhe o gasto em console.anthropic.com > Usage.
// ============================================================

define('ANTHROPIC_API_KEY', 'COLE_AQUI_SUA_CHAVE_DA_ANTHROPIC');
define('MODEL', 'claude-sonnet-5-5');
define('MAX_TOKENS', 500);

header('Content-Type: application/json; charset=utf-8');
// Sem CORS aberto de propósito: o app chama este arquivo da mesma origem.
// (Origin * deixaria qualquer site gastar o seu crédito da Anthropic.)

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'method_not_allowed']);
  exit;
}

if (strpos(ANTHROPIC_API_KEY, 'sk-ant-') !== 0) {
  http_response_code(500);
  echo json_encode(['error' => 'not_configured']);
  exit;
}

// ---- limite simples de perguntas por IP, pra evitar gasto fora de controle ----
function nexusRateLimited($ip){
  $dir = sys_get_temp_dir() . '/lingex_nexus_rl';
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  $file = $dir . '/' . md5($ip) . '.json';
  $now = time();
  $windowSeconds = 3600; // 1 hora
  $limitPerWindow = 20;  // 20 perguntas por hora por pessoa

  $hits = [];
  if (file_exists($file)) {
    $raw = @file_get_contents($file);
    $hits = $raw ? (json_decode($raw, true) ?: []) : [];
  }
  $hits = array_values(array_filter($hits, function($t) use ($now, $windowSeconds){
    return ($now - $t) < $windowSeconds;
  }));
  if (count($hits) >= $limitPerWindow) return true;

  $hits[] = $now;
  @file_put_contents($file, json_encode($hits));
  return false;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (nexusRateLimited($ip)) {
  http_response_code(429);
  echo json_encode(['error' => 'rate_limited']);
  exit;
}

// ---- lê e valida o que o app mandou ----
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!$body || !isset($body['messages']) || !is_array($body['messages']) || !count($body['messages'])) {
  http_response_code(400);
  echo json_encode(['error' => 'bad_request']);
  exit;
}

$messages = array_slice($body['messages'], -10); // nunca mais que 10 mensagens por chamada
foreach ($messages as $m) {
  if (!isset($m['role'], $m['content']) || !in_array($m['role'], ['user', 'assistant'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'bad_message']);
    exit;
  }
  if (!is_string($m['content']) || strlen($m['content']) > 4000) {
    http_response_code(400);
    echo json_encode(['error' => 'message_too_long']);
    exit;
  }
}

// ---- chama a Anthropic de verdade ----
$payload = json_encode([
  'model' => MODEL,
  'max_tokens' => MAX_TOKENS,
  'messages' => $messages,
]);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'x-api-key: ' . ANTHROPIC_API_KEY,
    'anthropic-version: 2023-06-01',
  ],
  CURLOPT_TIMEOUT => 30,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($response === false) {
  http_response_code(502);
  echo json_encode(['error' => 'upstream_failed', 'detail' => $curlErr]);
  exit;
}

$data = json_decode($response, true);

if ($httpCode !== 200) {
  http_response_code($httpCode ?: 502);
  echo json_encode([
    'error' => 'anthropic_error',
    'status' => $httpCode,
    'detail' => $data['error']['message'] ?? ('http_' . $httpCode),
  ]);
  exit;
}

$text = '';
if (isset($data['content']) && is_array($data['content'])) {
  foreach ($data['content'] as $block) {
    if (($block['type'] ?? '') === 'text') {
      $text .= $block['text'];
    }
  }
}

echo json_encode(['text' => $text]);
