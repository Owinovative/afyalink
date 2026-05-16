<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Storage;

use RuntimeException;

final readonly class S3CompatibleCredentialStorage implements CredentialStorage
{
    public function __construct(
        private string $endpoint,
        private string $region,
        private string $bucket,
        private string $accessKey,
        private string $secretKey,
    ) {}

    public function put(string $storageKey, string $contents): void
    {
        $this->request('PUT', $storageKey, $contents);
    }

    public function exists(string $storageKey): bool
    {
        try {
            $this->request('HEAD', $storageKey);

            return true;
        } catch (RuntimeException) {
            return false;
        }
    }

    public function read(string $storageKey): string
    {
        return $this->request('GET', $storageKey);
    }

    private function request(string $method, string $storageKey, string $body = ''): string
    {
        $this->assertSafeKey($storageKey);

        $now = gmdate('Ymd\THis\Z');
        $date = substr($now, 0, 8);
        $payloadHash = hash('sha256', $body);
        $host = parse_url($this->endpoint, PHP_URL_HOST);
        if (!is_string($host) || $host === '') {
            throw new RuntimeException('S3 endpoint host is invalid.');
        }
        $port = parse_url($this->endpoint, PHP_URL_PORT);
        if (is_int($port)) {
            $host .= ':' . $port;
        }

        $canonicalUri = '/' . rawurlencode($this->bucket) . '/' . implode('/', array_map('rawurlencode', explode('/', $storageKey)));
        $headers = [
            'host' => $host,
            'x-amz-content-sha256' => $payloadHash,
            'x-amz-date' => $now,
        ];
        $signedHeaders = implode(';', array_keys($headers));
        $canonicalHeaders = '';
        foreach ($headers as $key => $value) {
            $canonicalHeaders .= "{$key}:{$value}\n";
        }

        $canonicalRequest = implode("\n", [
            $method,
            $canonicalUri,
            '',
            $canonicalHeaders,
            $signedHeaders,
            $payloadHash,
        ]);

        $scope = "{$date}/{$this->region}/s3/aws4_request";
        $stringToSign = implode("\n", [
            'AWS4-HMAC-SHA256',
            $now,
            $scope,
            hash('sha256', $canonicalRequest),
        ]);

        $signature = hash_hmac('sha256', $stringToSign, $this->signingKey($date));
        $headers['authorization'] = sprintf(
            'AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s',
            $this->accessKey,
            $scope,
            $signedHeaders,
            $signature,
        );

        $headerLines = [];
        foreach ($headers as $key => $value) {
            $headerLines[] = $key . ': ' . $value;
        }

        $url = rtrim($this->endpoint, '/') . $canonicalUri;
        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headerLines),
                'content' => $body,
                'ignore_errors' => true,
                'timeout' => 30,
            ],
        ]);

        $response = @file_get_contents($url, false, $context);
        $statusLine = $http_response_header[0] ?? 'HTTP/1.1 500';
        $status = preg_match('/\s(\d{3})\s/', $statusLine, $matches) ? (int) $matches[1] : 500;

        if ($status < 200 || $status >= 300) {
            throw new RuntimeException("Private object storage request failed with HTTP {$status}.");
        }

        return is_string($response) ? $response : '';
    }

    private function signingKey(string $date): string
    {
        $kDate = hash_hmac('sha256', $date, 'AWS4' . $this->secretKey, true);
        $kRegion = hash_hmac('sha256', $this->region, $kDate, true);
        $kService = hash_hmac('sha256', 's3', $kRegion, true);

        return hash_hmac('sha256', 'aws4_request', $kService, true);
    }

    private function assertSafeKey(string $storageKey): void
    {
        if (str_contains($storageKey, '..') || str_starts_with($storageKey, '/') || str_contains($storageKey, "\0")) {
            throw new RuntimeException('Unsafe storage key.');
        }
    }
}
