<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthService;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Infrastructure\Persistence\JsonDataStore;

$name = $argv[1] ?? getenv('AFYALINK_ADMIN_NAME') ?: null;
$email = $argv[2] ?? getenv('AFYALINK_ADMIN_EMAIL') ?: null;
$phone = $argv[3] ?? getenv('AFYALINK_ADMIN_PHONE') ?: null;
$password = $argv[4] ?? getenv('AFYALINK_ADMIN_PASSWORD') ?: null;

if (!$name || !$email || !$phone || !$password) {
    fwrite(STDERR, "Usage: php scripts/create-admin.php \"Name\" admin@example.com 0700000000 StrongPass123\n");
    exit(1);
}

$root = dirname(__DIR__);
$store = new JsonDataStore($root . '/storage/runtime/afyalink-dev.json');
$auth = new AuthService($store, new AuditLogger($store));
$user = $auth->createUser($name, $email, $phone, $password, [UserRole::Admin]);

echo sprintf("Admin ready: %s <%s> (id %d)\n", $user['name'], $user['email'], $user['id']);
