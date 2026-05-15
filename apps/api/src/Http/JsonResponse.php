<?php

declare(strict_types=1);

namespace Afyalink\Core\Http;

final readonly class JsonResponse
{
    /**
     * @param array<string, mixed> $payload
     */
    public function __construct(
        public array $payload,
        public int $status = 200,
    ) {}

    public function send(): void
    {
        http_response_code($this->status);
        header('Content-Type: application/json');
        echo json_encode($this->payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }
}
