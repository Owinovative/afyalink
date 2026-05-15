<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Credentials;

use Afyalink\Core\Domain\Enums\CredentialReviewStatus;
use Afyalink\Core\Domain\Enums\DocumentType;

final readonly class CredentialRecord
{
    public function __construct(
        public DocumentType $documentType,
        public string $storageKey,
        public string $checksum,
        public string $mimeType,
        public int $sizeBytes,
        public CredentialReviewStatus $reviewStatus = CredentialReviewStatus::Uploaded,
        public ?string $reviewNote = null,
    ) {}
}

