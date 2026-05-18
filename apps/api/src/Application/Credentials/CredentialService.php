<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Credentials;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Domain\Credentials\CredentialRecord;
use Afyalink\Core\Domain\Enums\CredentialReviewStatus;
use Afyalink\Core\Domain\Enums\DocumentType;
use Afyalink\Core\Domain\Security\FileUploadPolicy;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Infrastructure\Storage\CredentialStorage;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Exceptions\ValidationException;
use Afyalink\Core\Support\Validator;

final readonly class CredentialService
{
    public function __construct(
        private DataStore $store,
        private CredentialStorage $storage,
        private AuditLogger $audit,
        private FileUploadPolicy $policy = new FileUploadPolicy(),
        private ?NotificationService $notifications = null,
    ) {}

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function upload(AuthenticatedUser $user, array $input, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        Validator::requireFields($input, ['document_type', 'original_name', 'mime_type', 'content_base64']);

        $documentType = DocumentType::from((string) $input['document_type']);
        $contents = base64_decode((string) $input['content_base64'], true);
        if ($contents === false) {
            throw new ValidationException(['content_base64' => ['Document content must be valid base64.']]);
        }

        $safeName = preg_replace('/[^A-Za-z0-9._-]/', '-', basename((string) $input['original_name'])) ?: 'document.bin';
        $storageKey = sprintf(
            'professionals/%d/credentials/%s/%s-%s',
            $user->id,
            $documentType->value,
            gmdate('YmdHis'),
            $safeName,
        );

        $size = strlen($contents);
        $this->policy->assertAllowed((string) $input['mime_type'], $size, $storageKey);
        $this->storage->put($storageKey, $contents);
        $checksum = hash('sha256', $contents);

        $existing = $this->latestForType($user->id, $documentType);
        $replacementUpload = $existing !== null && ($existing['review_status'] ?? '') === CredentialReviewStatus::NeedsReplacement->value;
        if ($existing !== null && ($existing['review_status'] ?? '') === CredentialReviewStatus::NeedsReplacement->value) {
            $this->store->update('credentials', (int) $existing['id'], [
                'superseded_at' => gmdate(DATE_ATOM),
            ]);
        }

        $credential = $this->store->insert('credentials', [
            'user_id' => $user->id,
            'document_type' => $documentType->value,
            'storage_key' => $storageKey,
            'checksum' => $checksum,
            'mime_type' => (string) $input['mime_type'],
            'size_bytes' => $size,
            'original_name' => (string) $input['original_name'],
            'review_status' => CredentialReviewStatus::Uploaded->value,
            'review_note' => null,
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
            'superseded_at' => null,
        ]);

        $this->audit->record($user->id, $replacementUpload ? 'credential.replacement_uploaded' : 'credential.uploaded', 'Credential', (string) $credential['id'], [
            'document_type' => $documentType->value,
            'checksum' => $checksum,
            'mime_type' => $input['mime_type'],
            'size_bytes' => $size,
            'superseded_credential_id' => $existing['id'] ?? null,
        ], $ipAddress, $userAgent);

        return $this->safeCredential($credential);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listForUser(int $userId): array
    {
        $rows = $this->store->where(
            'credentials',
            static fn (array $row): bool => (int) $row['user_id'] === $userId && empty($row['superseded_at']),
        );

        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

        return array_map(fn (array $row): array => $this->safeCredential($row), $rows);
    }

    /**
     * @return array<string, CredentialRecord>
     */
    public function latestCredentialRecordsByUser(int $userId): array
    {
        $rows = $this->store->where(
            'credentials',
            static fn (array $row): bool => (int) $row['user_id'] === $userId && empty($row['superseded_at']),
        );
        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

        $records = [];
        foreach ($rows as $row) {
            $type = (string) $row['document_type'];
            if (isset($records[$type])) {
                continue;
            }

            $records[$type] = new CredentialRecord(
                documentType: DocumentType::from($type),
                storageKey: (string) $row['storage_key'],
                checksum: (string) $row['checksum'],
                mimeType: (string) $row['mime_type'],
                sizeBytes: (int) $row['size_bytes'],
                reviewStatus: CredentialReviewStatus::from((string) $row['review_status']),
                reviewNote: $row['review_note'] === null ? null : (string) $row['review_note'],
            );
        }

        return $records;
    }

    /**
     * @return array<string, mixed>
     */
    public function review(
        AuthenticatedUser $admin,
        int $credentialId,
        CredentialReviewStatus $status,
        ?string $note,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $credential = $this->store->find('credentials', $credentialId);
        if ($credential === null) {
            throw new NotFoundException('Credential was not found.');
        }

        $updated = $this->store->update('credentials', $credentialId, [
            'review_status' => $status->value,
            'review_note' => $note,
            'reviewed_by' => $admin->id,
            'reviewed_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($admin->id, 'credential.reviewed', 'Credential', (string) $credentialId, [
            'professional_user_id' => $credential['user_id'] ?? null,
            'document_type' => $credential['document_type'] ?? null,
            'status' => $status->value,
            'note' => $note,
        ], $ipAddress, $userAgent);

        if ($status === CredentialReviewStatus::NeedsReplacement && $this->notifications !== null) {
            $user = $this->store->find('users', (int) $credential['user_id']);
            if ($user !== null) {
                $this->notifications->credentialReplacementRequested($user, $updated, $note);
            }
        }

        return $this->safeCredential($updated);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function latestForType(int $userId, DocumentType $documentType): ?array
    {
        $rows = $this->store->where(
            'credentials',
            static fn (array $row): bool => (int) $row['user_id'] === $userId
                && ($row['document_type'] ?? '') === $documentType->value
                && empty($row['superseded_at']),
        );

        usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

        return $rows[0] ?? null;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeCredential(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'user_id' => (int) $row['user_id'],
            'document_type' => (string) $row['document_type'],
            'original_name' => (string) $row['original_name'],
            'mime_type' => (string) $row['mime_type'],
            'size_bytes' => (int) $row['size_bytes'],
            'checksum' => (string) $row['checksum'],
            'review_status' => (string) $row['review_status'],
            'review_note' => $row['review_note'] ?? null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }
}
