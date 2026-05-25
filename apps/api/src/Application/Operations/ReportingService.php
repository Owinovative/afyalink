<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Operations;

use Afyalink\Core\Infrastructure\Persistence\DataStore;

final readonly class ReportingService
{
    public function __construct(
        private DataStore $store,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function summaries(): array
    {
        return [
            'application_funnel' => $this->countBy('applications', 'status'),
            'verification_outcomes' => $this->countBy('verification_cases', 'status'),
            'interview_outcomes' => [
                'statuses' => $this->countBy('interviews', 'status'),
                'recommendations' => $this->countBy('interviews', 'recommendation'),
            ],
            'facility_onboarding' => $this->countBy('facilities', 'review_status'),
            'subscription_access' => $this->countBy('facility_access_subscriptions', 'status'),
            'candidate_publication' => $this->countBy('candidate_publications', 'status'),
            'recommendations' => $this->countBy('recommendation_requests', 'status'),
            'appointments' => $this->countBy('facility_requests', 'status'),
            'student_pipeline' => $this->studentPipeline(),
            'notifications' => $this->countBy('notification_outbox', 'status', ['queued' => 'pending']),
            'privacy_requests' => $this->countBy('privacy_requests', 'status'),
            'facility_requisitions' => $this->countBy('facility_requisitions', 'status'),
            'matching' => [
                'bands' => $this->countBy('candidate_matches', 'match_band'),
                'statuses' => $this->countBy('candidate_matches', 'status'),
            ],
            'placement_shortlists' => $this->countBy('placement_shortlists', 'status'),
            'placement_funnel' => $this->countBy('placements', 'status'),
            'facility_interview_requests' => $this->countBy('facility_interview_requests', 'status'),
            'communications' => $this->countBy('communication_threads', 'status'),
            'ai_assistance' => $this->countBy('ai_assistance_logs', 'status'),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function countBy(string $table, string $field, array $aliases = []): array
    {
        $counts = ['total' => 0];
        foreach ($this->store->all($table) as $row) {
            $value = (string) ($row[$field] ?? 'unknown');
            if ($value === '') {
                $value = 'not_set';
            }
            $key = $aliases[$value] ?? $value;
            $counts['total']++;
            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }

        return $counts;
    }

    /**
     * @return array<string, int>
     */
    private function studentPipeline(): array
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
            $counts[$status] = ($counts[$status] ?? 0) + 1;
        }

        return $counts;
    }
}
