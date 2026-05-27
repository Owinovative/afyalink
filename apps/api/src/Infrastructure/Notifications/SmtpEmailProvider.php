<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Notifications;

use RuntimeException;

final readonly class SmtpEmailProvider implements EmailProvider
{
    public function __construct(
        private string $host,
        private int $port,
        private ?string $username,
        private ?string $password,
        private string $encryption,
        private string $fromAddress,
        private string $fromName,
        private int $timeoutSeconds = 20,
    ) {}

    public function name(): string
    {
        return 'smtp';
    }

    /**
     * @param array<string, mixed> $metadata
     * @return array<string, mixed>
     */
    public function send(
        string $to,
        string $subject,
        string $body,
        ?string $actionUrl = null,
        array $metadata = [],
    ): array {
        $to = trim($to);
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('SMTP recipient email is invalid.');
        }
        if (!filter_var($this->fromAddress, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('SMTP from address is invalid.');
        }

        $socket = $this->connect();
        try {
            $this->expect($socket, [220]);
            $this->command($socket, 'EHLO afyalink.local', [250]);

            if (in_array($this->encryption, ['tls', 'starttls'], true)) {
                $this->command($socket, 'STARTTLS', [220]);
                if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new RuntimeException('SMTP STARTTLS negotiation failed.');
                }
                $this->command($socket, 'EHLO afyalink.local', [250]);
            }

            if ($this->username !== null && $this->username !== '') {
                $this->command($socket, 'AUTH LOGIN', [334]);
                $this->command($socket, base64_encode($this->username), [334]);
                $this->command($socket, base64_encode((string) $this->password), [235]);
            }

            $this->command($socket, 'MAIL FROM:<' . $this->fromAddress . '>', [250]);
            $this->command($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
            $this->command($socket, 'DATA', [354]);
            $this->write($socket, $this->message($to, $subject, $body, $actionUrl) . "\r\n.");
            $this->expect($socket, [250]);
            $this->command($socket, 'QUIT', [221]);
        } finally {
            fclose($socket);
        }

        return [
            'provider' => $this->name(),
            'delivered' => true,
            'recipient' => $this->maskEmail($to),
            'template' => $metadata['template'] ?? $metadata['type'] ?? null,
        ];
    }

    /**
     * @return resource
     */
    private function connect()
    {
        if (trim($this->host) === '') {
            throw new RuntimeException('SMTP_HOST is required when MAIL_DRIVER=smtp.');
        }

        $transport = in_array($this->encryption, ['ssl', 'smtps'], true) ? 'ssl://' : '';
        $errno = 0;
        $errstr = '';
        $socket = @stream_socket_client(
            $transport . $this->host . ':' . $this->port,
            $errno,
            $errstr,
            $this->timeoutSeconds,
            STREAM_CLIENT_CONNECT,
        );

        if (!is_resource($socket)) {
            throw new RuntimeException('SMTP connection failed.');
        }

        stream_set_timeout($socket, $this->timeoutSeconds);

        return $socket;
    }

    /**
     * @param resource $socket
     * @param list<int> $expectedCodes
     */
    private function command($socket, string $command, array $expectedCodes): void
    {
        $this->write($socket, $command);
        $this->expect($socket, $expectedCodes);
    }

    /**
     * @param resource $socket
     */
    private function write($socket, string $line): void
    {
        fwrite($socket, $line . "\r\n");
    }

    /**
     * @param resource $socket
     * @param list<int> $expectedCodes
     */
    private function expect($socket, array $expectedCodes): void
    {
        $response = '';
        while (($line = fgets($socket, 2048)) !== false) {
            $response .= $line;
            if (preg_match('/^\d{3}\s/', $line) === 1) {
                break;
            }
        }

        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $expectedCodes, true)) {
            throw new RuntimeException('SMTP provider rejected the message.');
        }
    }

    private function message(string $to, string $subject, string $body, ?string $actionUrl): string
    {
        $text = trim($body);
        if ($actionUrl !== null && trim($actionUrl) !== '') {
            $text .= "\n\n" . trim($actionUrl);
        }

        $message = implode("\r\n", [
            'From: ' . $this->encodedHeader($this->fromName) . ' <' . $this->fromAddress . '>',
            'To: <' . $to . '>',
            'Subject: ' . $this->encodedHeader($subject),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'Date: ' . date(DATE_RFC2822),
            'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $this->messageIdDomain() . '>',
            '',
            str_replace(["\r\n", "\r"], "\n", $text),
        ]);

        return preg_replace('/^\./m', '..', str_replace("\n", "\r\n", $message)) ?? $message;
    }

    private function encodedHeader(string $value): string
    {
        if (preg_match('/[^\x20-\x7E]/', $value) !== 1) {
            return $value;
        }

        return '=?UTF-8?B?' . base64_encode($value) . '?=';
    }

    private function messageIdDomain(): string
    {
        return explode('@', $this->fromAddress, 2)[1] ?? 'afyalinks.org';
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');
        if ($domain === '') {
            return '[invalid-email]';
        }

        return substr($local, 0, 1) . '***@' . $domain;
    }
}
