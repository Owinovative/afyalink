<?php

declare(strict_types=1);

$roots = [
    __DIR__ . '/../src',
    __DIR__ . '/../tests',
];

$files = [];
foreach ($roots as $root) {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));
    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $files[] = $file->getPathname();
        }
    }
}

sort($files);

foreach ($files as $file) {
    $command = sprintf('php -l %s', escapeshellarg($file));
    passthru($command, $exitCode);
    if ($exitCode !== 0) {
        exit($exitCode);
    }
}

echo count($files) . " PHP files linted.\n";

