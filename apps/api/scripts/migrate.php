<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Afyalink\Core\Infrastructure\AppFactory;
use Afyalink\Core\Infrastructure\Config\AppConfig;
use Afyalink\Core\Infrastructure\Config\EnvLoader;
use Afyalink\Core\Infrastructure\Persistence\PdoPostgresDataStore;

$root = dirname(__DIR__);
$config = AppConfig::fromEnv(EnvLoader::load(dirname($root, 2) . '/.env'), $root);

if (!in_array($config->datastoreDriver, ['pgsql', 'postgres', 'postgresql'], true)) {
    fwrite(STDERR, "Migrations require AFYALINK_DATASTORE=pgsql and DATABASE_URL.\n");
    exit(1);
}

$store = AppFactory::dataStore($config);
if (!$store instanceof PdoPostgresDataStore) {
    fwrite(STDERR, "PostgreSQL datastore could not be initialized.\n");
    exit(1);
}

$pdo = $store->pdo();
$pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(190) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');

$files = glob($root . '/database/migrations/*.sql') ?: [];
sort($files);

foreach ($files as $file) {
    $version = basename($file);
    $statement = $pdo->prepare('SELECT 1 FROM schema_migrations WHERE version = :version');
    $statement->execute(['version' => $version]);
    if ($statement->fetchColumn()) {
        echo "SKIP {$version}\n";
        continue;
    }

    $sql = file_get_contents($file);
    if ($sql === false) {
        throw new RuntimeException("Could not read migration {$version}.");
    }

    $pdo->beginTransaction();
    try {
        $pdo->exec($sql);
        $insert = $pdo->prepare('INSERT INTO schema_migrations (version) VALUES (:version)');
        $insert->execute(['version' => $version]);
        $pdo->commit();
        echo "APPLY {$version}\n";
    } catch (Throwable $exception) {
        $pdo->rollBack();
        throw $exception;
    }
}
