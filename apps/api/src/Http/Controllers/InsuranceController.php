<?php

declare(strict_types=1);

namespace Afyalink\Core\Http\Controllers;

use Afyalink\Core\Application\Insurance\InsuranceService;
use Afyalink\Core\Http\Request;
use Afyalink\Core\Support\Validator;
use Afyalink\Core\Support\Exceptions\ValidationException;

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

        // Basic sanity checks
        Validator::minLength('name', $request->body['name'] ?? '', 2);

        // Dependents is optional, default to 0 and must be numeric
        $dependents = (int) ($request->body['dependents'] ?? 0);
        Validator::positiveNumber('dependents', $dependents);

        // Validate allowed tiers and cover types
        $allowedTiers = ['basic', 'standard', 'premium'];
        $allowedCoverTypes = ['individual', 'family', 'corporate', 'indemnity'];

        $tier = (string) ($request->body['tier'] ?? '');
        $coverType = (string) ($request->body['coverType'] ?? '');

        if (!in_array($tier, $allowedTiers, true)) {
            throw new ValidationException(['tier' => ['Invalid tier selected.']]);
        }

        if (!in_array(strtolower($coverType), $allowedCoverTypes, true)) {
            throw new ValidationException(['coverType' => ['Invalid cover type.']]);
        }

        $policy = $this->insurance->generateQuote(
            name: (string) $request->body['name'],
            email: (string) $request->body['email'],
            phone: (string) $request->body['phone'],
            dob: (string) $request->body['dob'],
            coverType: $coverType,
            dependents: $dependents,
            tier: $tier,
            ipAddress: $request->ipAddress,
        );

        return [
            'success' => true,
            'message' => 'Insurance quote generated successfully.',
            'policy' => $policy,
        ];
    }
}
