<?php

declare(strict_types=1);

namespace Afyalink\Core\Http;

use Afyalink\Core\Application\Auth\AuthenticatedUser;

final class Request
{
    /**
     * @param array<string, string> $headers
     * @param array<string, mixed> $body
     * @param array<string, mixed> $query
     * @param array<string, string> $params
     */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $headers = [],
        public readonly array $body = [],
        public readonly array $query = [],
        public array $params = [],
        public ?AuthenticatedUser $user = null,
        public readonly ?string $ipAddress = null,
        public readonly ?string $userAgent = null,
    ) {}

    public function bearerToken(): ?string
    {
        $header = $this->headers['authorization'] ?? $this->headers['Authorization'] ?? null;
        if ($header === null || !str_starts_with($header, 'Bearer ')) {
            return null;
        }

        return trim(substr($header, 7));
    }

    public static function fromGlobals(): self
    {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $raw = file_get_contents('php://input') ?: '';
        $body = $raw === '' ? [] : json_decode($raw, true);
        if (!is_array($body)) {
            $body = [];
        }

        $path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';

        return new self(
            method: strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            path: $path,
            headers: $headers,
            body: $body,
            query: $_GET,
            ipAddress: $_SERVER['REMOTE_ADDR'] ?? null,
            userAgent: $_SERVER['HTTP_USER_AGENT'] ?? null,
        );
    }
}
