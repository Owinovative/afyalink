<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthService;
use Afyalink\Core\Domain\Enums\UserRole;
use Afyalink\Core\Infrastructure\AppFactory;
use Afyalink\Core\Infrastructure\Config\AppConfig;
use Afyalink\Core\Infrastructure\Config\EnvLoader;
use Afyalink\Core\Support\Exceptions\ValidationException;

$name = $argv[1] ?? getenv('AFYALINK_ADMIN_NAME') ?: null;
$email = $argv[2] ?? getenv('AFYALINK_ADMIN_EMAIL') ?: null;
$phone = $argv[3] ?? getenv('AFYALINK_ADMIN_PHONE') ?: null;
$password = $argv[4] ?? getenv('AFYALINK_ADMIN_PASSWORD') ?: null;

if (!$name || !$email || !$phone || !$password) {
    fwrite(STDERR, "Usage: php scripts/create-admin.php \"Name\" admin@example.com 0700000000 StrongPass123\n");
    exit(1);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Admin email is not valid.\n");
    exit(1);
}

$root = dirname(__DIR__);
$config = AppConfig::fromEnv(EnvLoader::load(dirname($root, 2) . '/.env'), $root);
$store = AppFactory::dataStore($config);
$auth = new AuthService($store, new AuditLogger($store));
$normalizedEmail = strtolower(trim((string) $email));
$normalizedPhone = trim((string) $phone);
$existingEmail = $store->first('users', static fn (array $row): bool => strtolower((string) $row['email']) === $normalizedEmail);
$existingPhone = $store->first('users', static fn (array $row): bool => (string) $row['phone'] === $normalizedPhone);

if ($existingEmail !== null) {
    $roles = array_map(static fn (mixed $role): string => (string) $role, $existingEmail['roles'] ?? []);
    if (in_array(UserRole::Admin->value, $roles, true) || in_array(UserRole::SuperAdmin->value, $roles, true)) {
        echo sprintf("Admin already exists: %s <%s> (id %d)\n", $existingEmail['name'], $existingEmail['email'], $existingEmail['id']);
        exit(0);
    }

    fwrite(STDERR, "A non-admin account already exists for this email.\n");
    exit(1);
}

if ($existingPhone !== null) {
    fwrite(STDERR, "An account already exists for this phone number.\n");
    exit(1);
}

try {
    $user = $auth->createUser($name, $normalizedEmail, $normalizedPhone, $password, [UserRole::Admin]);
} catch (ValidationException $exception) {
    fwrite(STDERR, $exception->getMessage() . "\n");
    foreach ($exception->errors as $field => $messages) {
        fwrite(STDERR, sprintf("- %s: %s\n", $field, implode(', ', $messages)));
    }
    exit(1);
}

echo sprintf("Admin ready: %s <%s> (id %d)\n", $user['name'], $user['email'], $user['id']);
