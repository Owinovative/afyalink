<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Afyalink\Core\Infrastructure\AppFactory;
use Afyalink\Core\Infrastructure\Config\AppConfig;
use Afyalink\Core\Infrastructure\Config\EnvLoader;
use Afyalink\Core\Http\Request;

$root = dirname(__DIR__);
$env = EnvLoader::load(dirname($root, 2) . '/.env');

$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
$allowedOrigins = array_values(array_filter(array_map(
    static fn (string $value): string => trim($value),
    explode(',', (string) ($env['CORS_ALLOWED_ORIGINS'] ?? $env['APP_URL'] ?? '')),
)));
if (is_string($origin) && ($allowedOrigins === ['*'] || in_array($origin, $allowedOrigins, true))) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 600');
}

if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$kernel = AppFactory::kernel(AppConfig::fromEnv($env, $root));

$kernel->handle(Request::fromGlobals())->send();
