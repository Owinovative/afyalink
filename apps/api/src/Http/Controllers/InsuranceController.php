<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Insurance\InsuranceService;
use Afyalink\Core\Http\Request;
use Afyalink\Core\Support\Validator;

final readonly class InsuranceController
{
    public function __construct(
        private InsuranceService $insurance
    ) {}

    /**
     * Generates a public B2C insurance quote.
     * * @return array<string, mixed>
     */
    public function generatePublicQuote(Request $request): array
    {
        Validator::requireFields($request->body, [
            'name', 
            'email', 
            'phone', 
            'dob', 
            'coverType', 
            'tier'
        ]);
        Validator::email('email', $request->body['email']);

        // Dependents is optional, default to 0
        $dependents = (int) ($request->body['dependents'] ?? 0);

        $policy = $this->insurance->generateQuote(
            name: (string) $request->body['name'],
            email: (string) $request->body['email'],
            phone: (string) $request->body['phone'],
            dob: (string) $request->body['dob'],
            coverType: (string) $request->body['coverType'],
            dependents: $dependents,
            tier: (string) $request->body['tier'],
            ipAddress: $request->ipAddress,
        );

        return [
            'success' => true,
            'message' => 'Insurance quote generated successfully.',
            'policy' => $policy,
        ];
    }
}
