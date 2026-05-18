<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Interviews;

use Afyalink\Core\Application\Applications\ApplicationWorkflowService;
use Afyalink\Core\Application\Audit\AuditLogger;
use Afyalink\Core\Application\Auth\AuthenticatedUser;
use Afyalink\Core\Application\Notifications\NotificationService;
use Afyalink\Core\Domain\Enums\ApplicationStatus;
use Afyalink\Core\Domain\Enums\InterviewRecommendation;
use Afyalink\Core\Domain\Enums\InterviewStatus;
use Afyalink\Core\Infrastructure\Persistence\DataStore;
use Afyalink\Core\Support\Exceptions\NotFoundException;
use DateTimeImmutable;
use DomainException;

final readonly class InterviewService
{
    /** @var list<string> */
    private const RUBRIC_CATEGORIES = [
        'professional_knowledge',
        'communication',
        'ethical_judgment',
        'practical_readiness',
        'role_fit',
    ];

    public function __construct(
        private DataStore $store,
        private ApplicationWorkflowService $workflow,
        private AuditLogger $audit,
        private ?NotificationService $notifications = null,
    ) {}

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function schedule(
        AuthenticatedUser $admin,
        int $applicationId,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $application = $this->workflow->findApplication($applicationId);
        $this->assertApplicationEligibleForScheduling($application, $admin, $ipAddress, $userAgent);
        $start = $this->parseDateTime((string) ($input['scheduled_start_at'] ?? ''));
        $end = $this->parseDateTime((string) ($input['scheduled_end_at'] ?? ''));
        if ($end <= $start) {
            throw new DomainException('Interview end time must be after the start time.');
        }

        $existing = $this->store->first('interviews', static fn (array $row): bool => (
            (int) $row['application_id'] === $applicationId
            && in_array((string) $row['status'], [InterviewStatus::PendingSchedule->value, InterviewStatus::Scheduled->value], true)
        ));
        $now = gmdate(DATE_ATOM);
        $timelineEvent = [
            'from' => $existing['status'] ?? null,
            'to' => InterviewStatus::Scheduled->value,
            'note' => trim((string) ($input['notes'] ?? 'Interview scheduled.')),
            'actor_id' => $admin->id,
            'occurred_at' => $now,
        ];

        if ($existing === null) {
            $interview = $this->store->insert('interviews', [
                'application_id' => $applicationId,
                'user_id' => (int) $application['user_id'],
                'interviewer_id' => isset($input['interviewer_id']) && $input['interviewer_id'] !== '' ? (int) $input['interviewer_id'] : $admin->id,
                'scheduled_start_at' => $start->format(DATE_ATOM),
                'scheduled_end_at' => $end->format(DATE_ATOM),
                'mode' => trim((string) ($input['mode'] ?? 'remote')),
                'location' => isset($input['location']) ? trim((string) $input['location']) : null,
                'status' => InterviewStatus::Scheduled->value,
                'notes' => isset($input['notes']) ? trim((string) $input['notes']) : null,
                'recommendation' => null,
                'total_score' => null,
                'average_score' => null,
                'timeline' => [$timelineEvent],
                'completed_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $action = 'interview.scheduled';
        } else {
            $timeline = $existing['timeline'] ?? [];
            $timeline[] = $timelineEvent;
            $interview = $this->store->update('interviews', (int) $existing['id'], [
                'interviewer_id' => isset($input['interviewer_id']) && $input['interviewer_id'] !== '' ? (int) $input['interviewer_id'] : ($existing['interviewer_id'] ?? $admin->id),
                'scheduled_start_at' => $start->format(DATE_ATOM),
                'scheduled_end_at' => $end->format(DATE_ATOM),
                'mode' => trim((string) ($input['mode'] ?? $existing['mode'] ?? 'remote')),
                'location' => array_key_exists('location', $input) ? trim((string) $input['location']) : ($existing['location'] ?? null),
                'status' => InterviewStatus::Scheduled->value,
                'notes' => array_key_exists('notes', $input) ? trim((string) $input['notes']) : ($existing['notes'] ?? null),
                'timeline' => $timeline,
                'updated_at' => $now,
            ]);
            $action = 'interview.rescheduled';
        }

        $latestApplication = $this->workflow->findApplication($applicationId);
        if ((string) $latestApplication['status'] !== ApplicationStatus::InterviewScheduled->value) {
            $this->workflow->transitionStatus(
                applicationId: $applicationId,
                to: ApplicationStatus::InterviewScheduled,
                note: 'Interview scheduled.',
                actorId: $admin->id,
                ipAddress: $ipAddress,
                userAgent: $userAgent,
                auditAction: 'interview.application_status_changed',
            );
        }

        $this->audit->record($admin->id, $action, 'Interview', (string) $interview['id'], [
            'application_id' => $applicationId,
            'professional_user_id' => $application['user_id'] ?? null,
            'interviewer_id' => $interview['interviewer_id'] ?? null,
            'scheduled_start_at' => $interview['scheduled_start_at'],
        ], $ipAddress, $userAgent);

        $user = $this->store->find('users', (int) $application['user_id']);
        if ($user !== null && $this->notifications !== null) {
            $this->notifications->interviewScheduled($user, $interview);
        }

        return $this->detail((int) $interview['id']);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function complete(
        AuthenticatedUser $admin,
        int $interviewId,
        array $input,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): array {
        $recommendation = InterviewRecommendation::from((string) ($input['recommendation'] ?? ''));
        $items = $input['scores'] ?? [];
        if (!is_array($items) || $items === []) {
            throw new DomainException('Interview score items are required.');
        }

        return $this->store->transaction(function () use ($admin, $interviewId, $input, $recommendation, $items, $ipAddress, $userAgent): array {
            $interview = $this->findInterview($interviewId);
            $from = InterviewStatus::from((string) $interview['status']);
            if ($from !== InterviewStatus::Scheduled) {
                throw new DomainException('Only scheduled interviews can be completed.');
            }

            $totals = $this->saveScoreItems($interviewId, $items);
            $now = gmdate(DATE_ATOM);
            $timeline = $interview['timeline'] ?? [];
            $timeline[] = [
                'from' => $from->value,
                'to' => InterviewStatus::Completed->value,
                'note' => trim((string) ($input['notes'] ?? 'Interview completed.')),
                'actor_id' => $admin->id,
                'occurred_at' => $now,
            ];

            $updated = $this->store->update('interviews', $interviewId, [
                'status' => InterviewStatus::Completed->value,
                'notes' => isset($input['notes']) ? trim((string) $input['notes']) : ($interview['notes'] ?? null),
                'recommendation' => $recommendation->value,
                'total_score' => $totals['total_score'],
                'average_score' => $totals['average_score'],
                'timeline' => $timeline,
                'completed_at' => $now,
                'updated_at' => $now,
            ]);

            $this->workflow->transitionStatus(
                applicationId: (int) $interview['application_id'],
                to: ApplicationStatus::InterviewCompleted,
                note: 'Interview completed.',
                actorId: $admin->id,
                ipAddress: $ipAddress,
                userAgent: $userAgent,
                auditAction: 'interview.application_status_changed',
            );

            $outcome = $recommendation === InterviewRecommendation::DoNotRecommend
                ? ApplicationStatus::NotQualified
                : ApplicationStatus::Qualified;
            $this->workflow->transitionStatus(
                applicationId: (int) $interview['application_id'],
                to: $outcome,
                note: 'Interview recommendation: ' . $recommendation->value,
                actorId: $admin->id,
                ipAddress: $ipAddress,
                userAgent: $userAgent,
                auditAction: 'interview.qualification_decision',
            );

            $this->audit->record($admin->id, 'interview.completed', 'Interview', (string) $interviewId, [
                'application_id' => $interview['application_id'] ?? null,
                'professional_user_id' => $interview['user_id'] ?? null,
                'recommendation' => $recommendation->value,
                'total_score' => $totals['total_score'],
                'average_score' => $totals['average_score'],
            ], $ipAddress, $userAgent);

            $user = $this->store->find('users', (int) $interview['user_id']);
            if ($user !== null && $this->notifications !== null) {
                $this->notifications->interviewCompleted($user, $updated, $recommendation->value);
            }

            return $this->detail($interviewId);
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function list(?string $status = null, ?int $interviewerId = null): array
    {
        $rows = $this->store->all('interviews');
        if ($status !== null && $status !== '') {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => ($row['status'] ?? '') === $status));
        }
        if ($interviewerId !== null) {
            $rows = array_values(array_filter($rows, static fn (array $row): bool => (int) ($row['interviewer_id'] ?? 0) === $interviewerId));
        }

        usort($rows, static fn (array $a, array $b): int => strcmp((string) ($b['scheduled_start_at'] ?? $b['created_at']), (string) ($a['scheduled_start_at'] ?? $a['created_at'])));

        return array_map(fn (array $row): array => $this->summary($row), $rows);
    }

    /**
     * @return array<string, int>
     */
    public function overview(): array
    {
        $counts = [
            'total' => 0,
            'pending_schedule' => 0,
            'scheduled' => 0,
            'completed' => 0,
            'cancelled' => 0,
            'no_show' => 0,
        ];

        foreach ($this->store->all('interviews') as $row) {
            $counts['total']++;
            $status = (string) ($row['status'] ?? '');
            if (array_key_exists($status, $counts)) {
                $counts[$status]++;
            }
        }

        return $counts;
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(int $interviewId): array
    {
        $interview = $this->findInterview($interviewId);

        return [
            'interview' => $interview,
            'application' => $this->workflow->findApplication((int) $interview['application_id']),
            'professional' => $this->safeUser((int) $interview['user_id']),
            'profile' => $this->profileForUser((int) $interview['user_id']),
            'scores' => $this->scoreItems($interviewId),
            'rubric' => self::RUBRIC_CATEGORIES,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function professionalInterviews(int $userId): array
    {
        $rows = $this->store->where('interviews', static fn (array $row): bool => (int) $row['user_id'] === $userId);
        usort($rows, static fn (array $a, array $b): int => strcmp((string) ($b['scheduled_start_at'] ?? $b['created_at']), (string) ($a['scheduled_start_at'] ?? $a['created_at'])));

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'status' => (string) $row['status'],
            'scheduled_start_at' => $row['scheduled_start_at'] ?? null,
            'scheduled_end_at' => $row['scheduled_end_at'] ?? null,
            'mode' => (string) ($row['mode'] ?? ''),
            'location' => $row['location'] ?? null,
            'recommendation' => $row['recommendation'] ?? null,
            'updated_at' => (string) $row['updated_at'],
        ], $rows);
    }

    /**
     * @param array<string, mixed> $application
     */
    private function assertApplicationEligibleForScheduling(
        array $application,
        AuthenticatedUser $admin,
        ?string $ipAddress,
        ?string $userAgent,
    ): void {
        $status = (string) $application['status'];
        if ($status === ApplicationStatus::Verified->value) {
            $this->workflow->transitionStatus(
                applicationId: (int) $application['id'],
                to: ApplicationStatus::VerificationPassed,
                note: 'Legacy verified application advanced to interview workflow.',
                actorId: $admin->id,
                ipAddress: $ipAddress,
                userAgent: $userAgent,
                auditAction: 'interview.legacy_application_status_changed',
            );

            return;
        }

        if ($status !== ApplicationStatus::VerificationPassed->value && $status !== ApplicationStatus::InterviewScheduled->value) {
            throw new DomainException('Interview can only be scheduled after verification passes.');
        }
    }

    /**
     * @param list<array<string, mixed>> $items
     * @return array{total_score: float, average_score: float}
     */
    private function saveScoreItems(int $interviewId, array $items): array
    {
        $total = 0.0;
        $weightTotal = 0.0;
        foreach ($items as $item) {
            if (!is_array($item)) {
                throw new DomainException('Invalid interview score item.');
            }

            $category = trim((string) ($item['category'] ?? ''));
            if ($category === '') {
                throw new DomainException('Score category is required.');
            }

            $score = (float) ($item['score'] ?? -1);
            $max = (float) ($item['max_score'] ?? 5);
            $weight = (float) ($item['weight'] ?? 1);
            if ($score < 0 || $max <= 0 || $score > $max || $weight <= 0) {
                throw new DomainException('Interview score values are outside the allowed range.');
            }

            $total += $score * $weight;
            $weightTotal += $weight;
            $existing = $this->store->first('interview_score_items', static fn (array $row): bool => (
                (int) $row['interview_id'] === $interviewId
                && (string) $row['category'] === $category
            ));
            $payload = [
                'interview_id' => $interviewId,
                'category' => $category,
                'score' => $score,
                'max_score' => $max,
                'weight' => $weight,
                'comment' => isset($item['comment']) ? trim((string) $item['comment']) : null,
                'updated_at' => gmdate(DATE_ATOM),
            ];
            if ($existing === null) {
                $this->store->insert('interview_score_items', [
                    ...$payload,
                    'created_at' => gmdate(DATE_ATOM),
                ]);
            } else {
                $this->store->update('interview_score_items', (int) $existing['id'], $payload);
            }
        }

        return [
            'total_score' => round($total, 2),
            'average_score' => round($total / max(1.0, $weightTotal), 2),
        ];
    }

    private function parseDateTime(string $value): DateTimeImmutable
    {
        if (trim($value) === '') {
            throw new DomainException('Interview date and time are required.');
        }

        return new DateTimeImmutable($value);
    }

    /**
     * @return array<string, mixed>
     */
    private function findInterview(int $interviewId): array
    {
        $interview = $this->store->find('interviews', $interviewId);
        if ($interview === null) {
            throw new NotFoundException('Interview was not found.');
        }

        return $interview;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function scoreItems(int $interviewId): array
    {
        return $this->store->where('interview_score_items', static fn (array $row): bool => (int) $row['interview_id'] === $interviewId);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function summary(array $row): array
    {
        $profile = $this->profileForUser((int) $row['user_id']);
        $user = $this->store->find('users', (int) $row['user_id']);

        return [
            'id' => (int) $row['id'],
            'application_id' => (int) $row['application_id'],
            'status' => (string) $row['status'],
            'scheduled_start_at' => $row['scheduled_start_at'] ?? null,
            'scheduled_end_at' => $row['scheduled_end_at'] ?? null,
            'mode' => (string) ($row['mode'] ?? ''),
            'recommendation' => $row['recommendation'] ?? null,
            'total_score' => $row['total_score'] ?? null,
            'professional' => [
                'id' => (int) $row['user_id'],
                'name' => (string) ($user['name'] ?? $profile['name'] ?? ''),
                'email' => (string) ($user['email'] ?? $profile['email'] ?? ''),
                'profession' => (string) ($profile['profession'] ?? ''),
            ],
            'interviewer_id' => isset($row['interviewer_id']) && $row['interviewer_id'] !== null ? (int) $row['interviewer_id'] : null,
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function profileForUser(int $userId): ?array
    {
        return $this->store->first('profiles', static fn (array $row): bool => (int) $row['user_id'] === $userId);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function safeUser(int $userId): ?array
    {
        $user = $this->store->find('users', $userId);
        if ($user === null) {
            return null;
        }

        return [
            'id' => (int) $user['id'],
            'name' => (string) $user['name'],
            'email' => (string) $user['email'],
            'phone' => (string) $user['phone'],
        ];
    }
}

