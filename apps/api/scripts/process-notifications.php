<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Notifications\NotificationDeliveryService;
use Afyalink\Core\Infrastructure\AppFactory;
use Afyalink\Core\Infrastructure\Config\AppConfig;
use Afyalink\Core\Infrastructure\Config\EnvLoader;
use Afyalink\Core\Infrastructure\Notifications\EmailProviderFactory;

$root = dirname(__DIR__);
$config = AppConfig::fromEnv(EnvLoader::load(dirname($root, 2) . '/.env'), $root);
$store = AppFactory::dataStore($config);
$service = new NotificationDeliveryService(
    $store,
    new AuditLogger($store),
    EmailProviderFactory::fromConfig($config),
);

$limit = isset($argv[1]) ? max(1, min(100, (int) $argv[1])) : 25;
$result = $service->processPending($limit);

fwrite(STDOUT, json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
