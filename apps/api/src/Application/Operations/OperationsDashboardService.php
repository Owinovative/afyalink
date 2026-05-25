<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Operations;

use Afyalink\Core\Infrastructure\Persistence\DataStore;

final readonly class OperationsDashboardService
{
    public function __construct(
        private DataStore $store,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function commandCenter(): array
    {
        return [
            'applications' => $this->countBy('applications', 'status'),
            'credentials' => $this->countBy('credentials', 'review_status'),
            'payments' => $this->countBy('payments', 'status'),
            'verifications' => $this->countBy('verification_cases', 'status'),
            'interviews' => $this->countBy('interviews', 'status'),
            'facilities' => $this->countBy('facilities', 'review_status'),
            'subscriptions' => $this->countBy('facility_access_subscriptions', 'status'),
            'publications' => $this->countBy('candidate_publications', 'status'),
            'recommendation_requests' => $this->countBy('recommendation_requests', 'status'),
            'appointment_requests' => $this->countBy('facility_requests', 'status'),
            'requisitions' => $this->countBy('facility_requisitions', 'status'),
            'candidate_matches' => $this->countBy('candidate_matches', 'match_band'),
            'placement_shortlists' => $this->countBy('placement_shortlists', 'status'),
            'placements' => $this->countBy('placements', 'status'),
            'communication_threads' => $this->countBy('communication_threads', 'status'),
            'students' => $this->studentCounts(),
            'notifications' => $this->countBy('notification_outbox', 'status', ['queued' => 'pending']),
            'privacy_requests' => $this->countBy('privacy_requests', 'status'),
            'work_queues' => $this->workQueues(),
            'recent_audit_events' => $this->recentAuditEvents(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function workQueues(): array
    {
        return [
            'payment_reviews' => $this->countWhere('payments', static fn (array $row): bool => in_array((string) ($row['status'] ?? ''), ['initiated', 'pending_verification', 'awaiting_provider'], true)),
            'notification_failures' => $this->countWhere('notification_outbox', static fn (array $row): bool => in_array((string) ($row['status'] ?? ''), ['failed', 'retry_scheduled'], true)),
            'verification_backlog' => $this->countWhere('verification_cases', static fn (array $row): bool => in_array((string) ($row['status'] ?? ''), ['pending', 'assigned', 'in_progress', 'awaiting_external_response'], true)),
            'interview_backlog' => $this->countWhere('interviews', static fn (array $row): bool => in_array((string) ($row['status'] ?? ''), ['pending_schedule', 'scheduled'], true)),
            'facility_subscription_renewals' => $this->expiringSubscriptionCount(),
            'students_awaiting_license' => $this->countWhere('profiles', static fn (array $row): bool => ($row['applicant_track'] ?? '') === 'student_awaiting_license' && ($row['conversion_review_status'] ?? '') !== 'converted'),
            'publication_ready_professionals' => $this->countWhere('applications', static fn (array $row): bool => in_array((string) ($row['status'] ?? ''), ['qualified', 'approved'], true)),
            'privacy_requests' => $this->countWhere('privacy_requests', static fn (array $row): bool => in_array((string) ($row['status'] ?? ''), ['submitted', 'under_review'], true)),
            'requisitions_submitted' => $this->countWhere('facility_requisitions', static fn (array $row): bool => in_array((string) ($row['status'] ?? ''), ['submitted', 'under_review', 'matching'], true)),
            'shortlists_ready' => $this->countWhere('placement_shortlists', static fn (array $row): bool => ($row['status'] ?? '') === 'shared'),
            'active_placements' => $this->countWhere('placements', static fn (array $row): bool => in_array((string) ($row['status'] ?? ''), ['proposed', 'facility_interested', 'professional_contacted', 'interview_requested', 'interview_scheduled', 'offer_pending', 'offer_made', 'onboarding', 'placed'], true)),
            'open_communications' => $this->countWhere('communication_threads', static fn (array $row): bool => ($row['status'] ?? '') === 'open'),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function countBy(string $table, string $field, array $aliases = []): array
    {
        $counts = ['total' => 0];
        foreach ($this->store->all($table) as $row) {
            $key = (string) ($row[$field] ?? 'unknown');
            $key = $aliases[$key] ?? $key;
            $counts['total']++;
            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }

        return $counts;
    }

    /**
     * @param callable(array<string, mixed>): bool $predicate
     */
    private function countWhere(string $table, callable $predicate): int
    {
        return count($this->store->where($table, $predicate));
    }

    private function expiringSubscriptionCount(): int
    {
        $threshold = time() + (30 * 86400);

        return $this->countWhere('facility_access_subscriptions', static function (array $row) use ($threshold): bool {
            if (($row['status'] ?? '') !== 'active' || empty($row['ends_at'])) {
                return false;
            }

            $expiresAt = strtotime((string) $row['ends_at']);

            return $expiresAt !== false && $expiresAt <= $threshold;
        });
    }

    /**
     * @return array<string, int>
     */
    private function studentCounts(): array
    {
        $counts = ['total' => 0, 'waiting_for_license' => 0, 'license_submitted' => 0, 'converted' => 0];
        foreach ($this->store->all('profiles') as $row) {
            $isStudentTrack = ($row['applicant_track'] ?? '') === 'student_awaiting_license';
            $isConverted = ($row['conversion_review_status'] ?? '') === 'converted' || !empty($row['converted_to_licensed_at']);
            if (!$isStudentTrack && !$isConverted) {
                continue;
            }
            $counts['total']++;
            $status = (string) ($row['conversion_review_status'] ?? 'waiting_for_license');
            if (isset($counts[$status])) {
                $counts[$status]++;
            }
        }

        return $counts;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentAuditEvents(): array
    {
        $rows = $this->store->all('audit_logs');
        usort($rows, static fn (array $a, array $b): int => strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? '')));

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'actor_id' => $row['actor_id'] ?? null,
            'action' => (string) ($row['action'] ?? ''),
            'entity_type' => (string) ($row['entity_type'] ?? ''),
            'entity_id' => $row['entity_id'] ?? null,
            'created_at' => (string) ($row['created_at'] ?? ''),
        ], array_slice($rows, 0, 10));
    }
}
