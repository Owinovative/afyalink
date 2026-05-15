<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Afyalink\Core\Infrastructure\AppFactory;
use Afyalink\Core\Infrastructure\Config\AppConfig;
use Afyalink\Core\Infrastructure\Config\EnvLoader;
use Afyalink\Core\Http\Request;

$root = dirname(__DIR__);
$env = EnvLoader::load(dirname($root, 2) . '/.env');
$kernel = AppFactory::kernel(AppConfig::fromEnv($env, $root));

$kernel->handle(Request::fromGlobals())->send();
