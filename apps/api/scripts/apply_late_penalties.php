<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Afyalink\Core\Infrastructure\AppFactory;
use Afyalink\Core\Infrastructure\Config\AppConfig;
use Afyalink\Core\Infrastructure\Config\EnvLoader;
use Afyalink\Core\Infrastructure\Persistence\PdoPostgresDataStore;

$root = dirname(__DIR__);
$envPath = dirname($root, 2) . '/.env';
$envVars = file_exists($envPath) ? EnvLoader::load($envPath) : [];
$config = AppConfig::fromEnv($envVars, $root);

$store = AppFactory::dataStore($config);
if (!$store instanceof PdoPostgresDataStore) {
    fwrite(STDERR, "PostgreSQL datastore could not be initialized.\n");
    exit(1);
}

$pdo = $store->pdo();

$dayOfMonth = (int) gmdate('j');
if ($dayOfMonth <= 10) {
    echo "Current day is $dayOfMonth (<= 10). No penalties applied today.\n";
    exit(0);
}

// 1% daily penalty of the base premium
$sql = "
    UPDATE insurance_policies
    SET penalty_cents = COALESCE(penalty_cents, 0) + CAST((premium_cents * 0.01) AS INT)
    WHERE is_active = true
      AND next_due_date < NOW()
";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $count = $stmt->rowCount();
    
    echo "Late penalties applied to $count policies.\n";
} catch (\Throwable $e) {
    fwrite(STDERR, "Error applying penalties: " . $e->getMessage() . "\n");
    exit(1);
}
