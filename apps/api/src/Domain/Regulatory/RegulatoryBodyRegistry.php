<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Regulatory;

final class RegulatoryBodyRegistry
{
    /**
     * @return list<RegulatoryBody>
     */
    public function priorityBodies(): array
    {
        return [
            new RegulatoryBody('KMPDC', 'Kenya Medical Practitioners and Dentists Council', ['doctor', 'dentist']),
            new RegulatoryBody('NCK', 'Nursing Council of Kenya', ['nurse', 'midwife']),
            new RegulatoryBody('COC', 'Clinical Officers Council', ['clinical officer']),
            new RegulatoryBody('PPB', 'Pharmacy and Poisons Board', ['pharmacist', 'pharmaceutical technologist']),
            new RegulatoryBody('PHOTC', 'Public Health Officers and Technicians Council', ['public health officer', 'public health technician']),
            new RegulatoryBody('OTHER', 'Other Profession-Specific Regulatory Body', ['laboratory', 'physiotherapy', 'occupational therapy', 'nutrition']),
        ];
    }

    public function findByProfession(string $profession): ?RegulatoryBody
    {
        $normalized = strtolower($profession);

        foreach ($this->priorityBodies() as $body) {
            foreach ($body->supportedProfessions as $supportedProfession) {
                if (str_contains($normalized, strtolower($supportedProfession))) {
                    return $body;
                }
            }
        }

        return null;
    }
}

