<?php

declare(strict_types=1);

namespace Afyalink\Core\Infrastructure\Notifications;

use Afyalink\Core\Infrastructure\Config\AppConfig;

final class EmailProviderFactory
{
    public static function fromConfig(AppConfig $config): EmailProvider
    {
        $driver = strtolower($config->mailDriver);

        return match ($driver) {
            'null', 'log', 'array' => new LogEmailProvider(
                fromAddress: $config->mailFromAddress,
                fromName: $config->mailFromName,
                writeToErrorLog: $driver === 'log',
            ),
            'smtp' => new SmtpEmailProvider(
                host: (string) $config->smtpHost,
                port: $config->smtpPort,
                username: $config->smtpUsername,
                password: $config->smtpPassword,
                encryption: $config->smtpEncryption,
                fromAddress: $config->mailFromAddress,
                fromName: $config->mailFromName,
            ),
            default => new LogEmailProvider(
                fromAddress: $config->mailFromAddress,
                fromName: $config->mailFromName,
                writeToErrorLog: true,
            ),
        };
    }
}
