<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Privacy;

use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use Afyalink\Core\Support\Validator;
use DomainException;

final readonly class PrivacyRequestService
{
    private const TYPES = ['data_access', 'correction', 'deletion_retention', 'consent_withdrawal'];
    private const STATUSES = ['submitted', 'under_review', 'completed', 'rejected', 'cancelled'];

    public function __construct(
        private DataStore $store,
        private AuditLogger $audit,
    ) {}

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function submit(
        ?AuthenticatedUser $user,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['request_type', 'subject_name', 'subject_email', 'description']);
        $type = (string) $input['request_type'];
        if (!in_array($type, self::TYPES, true)) {
            throw new DomainException('Privacy request type is not supported.');
        }

        $row = $this->store->insert('privacy_requests', [
            'requester_user_id' => $user?->id,
            'request_type' => $type,
            'status' => 'submitted',
            'subject_name' => trim((string) $input['subject_name']),
            'subject_email' => strtolower(trim((string) $input['subject_email'])),
            'description' => trim((string) $input['description']),
            'admin_note' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'created_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($user?->id, 'privacy_request.submitted', 'PrivacyRequest', (string) $row['id'], [
            'request_type' => $type,
            'subject_email' => $this->maskEmail((string) $row['subject_email']),
        ], $ipAddress, $userAgent);

        return $this->safeRequest($row);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function list(?string $status = null): array
    {
        $rows = $this->store->all('privacy_requests');
        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['status'] ?? '') === $status));
        }
        usort($rows, static fn (array $a, array $b): int => strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? '')));

        return array_map(fn (array $row): array => $this->safeRequest($row), $rows);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function update(
        AuthenticatedUser $admin,
        int $requestId,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        Validator::requireFields($input, ['status']);
        $row = $this->store->find('privacy_requests', $requestId);
        if ($row === null) {
            throw new NotFoundException('Privacy request was not found.');
        }
        $status = (string) $input['status'];
        if (!in_array($status, self::STATUSES, true)) {
            throw new DomainException('Privacy request status is not supported.');
        }

        $updated = $this->store->update('privacy_requests', $requestId, [
            'status' => $status,
            'admin_note' => isset($input['admin_note']) ? trim((string) $input['admin_note']) : ($row['admin_note'] ?? null),
            'reviewed_by' => $admin->id,
            'reviewed_at' => gmdate(DATE_ATOM),
            'updated_at' => gmdate(DATE_ATOM),
        ]);

        $this->audit->record($admin->id, 'privacy_request.status_changed', 'PrivacyRequest', (string) $requestId, [
            'from' => $row['status'] ?? null,
            'to' => $status,
            'request_type' => $row['request_type'] ?? null,
        ], $ipAddress, $userAgent);

        return $this->safeRequest($updated);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function safeRequest(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'requester_user_id' => $row['requester_user_id'] ?? null,
            'request_type' => (string) $row['request_type'],
            'status' => (string) $row['status'],
            'subject_name' => (string) $row['subject_name'],
            'subject_email' => $this->maskEmail((string) $row['subject_email']),
            'description' => (string) $row['description'],
            'admin_note' => $row['admin_note'] ?? null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
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
