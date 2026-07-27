<?php
declare(strict_types=1);

$scope = 'ielti-chilam-personal-site-v1';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$dir = __DIR__ . '/ielti-progress';
$file = $dir . '/progress.json';

header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($method === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if ($auth !== 'Bearer ' . $scope) {
  http_response_code(401);
  echo json_encode(['error' => 'unauthorized'], JSON_UNESCAPED_UNICODE);
  exit;
}

if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
  http_response_code(500);
  echo json_encode(['error' => 'cannot create storage'], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($method === 'GET') {
  if (!is_file($file)) {
    echo json_encode(['version' => 3, 'empty' => true], JSON_UNESCAPED_UNICODE);
    exit;
  }
  readfile($file);
  exit;
}

if ($method === 'POST' || $method === 'PUT') {
  $body = file_get_contents('php://input') ?: '';
  $data = json_decode($body, true);
  if (!is_array($data) || ($data['version'] ?? null) !== 3) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid progress'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  $payload = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  if ($payload === false || file_put_contents($file, $payload, LOCK_EX) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'cannot save progress'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'method not allowed'], JSON_UNESCAPED_UNICODE);
