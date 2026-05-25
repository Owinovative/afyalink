<?php

declare(strict_types=1);

namespace Afyalink\Core\Application\Integrations;

final readonly class FhirMappingService
{
    /**
     * @param array<string, mixed> $profile
     * @return array<string, mixed>
     */
    public function practitionerFromProfile(array $profile): array
    {
        return [
            'resourceType' => 'Practitioner',
            'identifier' => [
                [
                    'system' => 'https://afyalink.local/professionals',
                    'value' => 'professional-' . (string) ($profile['user_id'] ?? $profile['id'] ?? 'unknown'),
                ],
            ],
            'name' => [
                [
                    'text' => (string) ($profile['name'] ?? 'Afyalink professional'),
                ],
            ],
            'qualification' => [
                [
                    'code' => [
                        'text' => (string) ($profile['profession'] ?? $profile['target_profession'] ?? 'Healthcare professional'),
                    ],
                    'issuer' => [
                        'display' => (string) ($profile['regulatory_body'] ?? $profile['expected_regulatory_body'] ?? ''),
                    ],
                    'identifier' => [
                        [
                            'value' => (string) ($profile['license_number'] ?? ''),
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * @param array<string, mixed> $facility
     * @return array<string, mixed>
     */
    public function organizationFromFacility(array $facility): array
    {
        return [
            'resourceType' => 'Organization',
            'identifier' => [
                [
                    'system' => 'https://afyalink.local/facilities',
                    'value' => 'facility-' . (string) ($facility['id'] ?? 'unknown'),
                ],
            ],
            'name' => (string) ($facility['display_name'] ?? $facility['legal_name'] ?? 'Afyalink facility'),
            'type' => [
                [
                    'text' => (string) ($facility['facility_type'] ?? 'Healthcare facility'),
                ],
            ],
        ];
    }

    /**
     * @param array<string, mixed> $credential
     * @return array<string, mixed>
     */
    public function documentReferenceFromCredentialMetadata(array $credential): array
    {
        return [
            'resourceType' => 'DocumentReference',
            'status' => 'current',
            'type' => [
                'text' => (string) ($credential['document_type'] ?? 'credential_metadata'),
            ],
            'description' => 'Afyalink credential metadata only. Private credential file content is not exposed through FHIR mapping.',
            'content' => [
                [
                    'attachment' => [
                        'contentType' => (string) ($credential['mime_type'] ?? 'application/octet-stream'),
                        'title' => (string) ($credential['original_name'] ?? 'credential'),
                        'hash' => (string) ($credential['checksum'] ?? ''),
                    ],
                ],
            ],
        ];
    }
}
