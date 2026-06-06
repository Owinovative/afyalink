<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Application\Insurance\GeneratePublicQuote;

class InsuranceController extends Controller
{
    public function generatePublicQuote(Request $request, GeneratePublicQuote $useCase): JsonResponse
    {
        // 1. Strict Validation
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string',
            'dob' => 'required|date',
            'coverType' => 'required|in:individual,family',
            'dependents' => 'nullable|integer',
            'tier' => 'required|in:basic,standard,premium',
        ]);

        try {
            // 2. Execute Business Logic
            $policyDetails = $useCase->execute($validated);

            return response()->json([
                'success' => true,
                'message' => 'Insurance quote generated and policy recorded.',
                'policy' => $policyDetails
            ], 201);

        } catch (\Exception $e) {
            \Log::error('[InsuranceController] Failed to generate quote: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Internal Server Error during underwriting calculation.'
            ], 500);
        }
    }
}
