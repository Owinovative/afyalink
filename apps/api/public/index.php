<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Afyalink\Core\Http\ApiKernel;
use Afyalink\Core\Http\Request;
use Afyalink\Core\Infrastructure\Persistence\JsonDataStore;
use Afyalink\Core\Infrastructure\Storage\LocalPrivateCredentialStorage;

$root = dirname(__DIR__);
$kernel = new ApiKernel(
    new JsonDataStore($root . '/storage/runtime/afyalink-dev.json'),
    new LocalPrivateCredentialStorage($root . '/storage/private/credentials'),
);

$kernel->handle(Request::fromGlobals())->send();
