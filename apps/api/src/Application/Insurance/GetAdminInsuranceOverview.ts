import { db } from "../../Infrastructure/Persistence/database"; // Adjust to your DB export
import { insurancePolicies } from "../../Infrastructure/Persistence/schema/insurance";
import { desc, eq } from "drizzle-orm";

export class GetAdminInsuranceOverview {
  
  public async execute() {
    // 1. Fetch all policies, ordered by newest first
    const rawPolicies = await db
      .select()
      .from(insurancePolicies)
      .orderBy(desc(insurancePolicies.createdAt));

    let totalMonthlyPremiumCents = 0;
    let activePoliciesCount = 0;
    let pendingCorporateCount = 0;

    // 2. Map the polymorphic database rows to clean frontend DTOs
    const mappedPolicies = rawPolicies.map((policy) => {
      
      // Calculate Metrics safely using integers
      if (policy.isActive) {
        totalMonthlyPremiumCents += policy.premiumCents;
        activePoliciesCount++;
      }
      if (!policy.isActive && policy.policyType === "corporate") {
        pendingCorporateCount++;
      }

      // Determine the category and owner name based on the polymorphic fields
      let category = "Unknown";
      let ownerName = "Unknown";

      if (policy.publicOwnerName) {
        category = "Public B2C";
        ownerName = policy.publicOwnerName;
      } else if (policy.professionalId) {
        category = "Professional";
        ownerName = "Verified Professional"; // In production, JOIN with professionals table
      } else if (policy.facilityId) {
        category = "Facility B2B";
        ownerName = "Verified Facility"; // In production, JOIN with facilities table
      }

      return {
        id: policy.policyNumber,
        type: policy.policyType,
        owner: ownerName,
        category: category,
        premium: policy.premiumCents / 100, // Convert cents to standard display currency
        status: policy.isActive ? "active" : "pending_payment",
        date: policy.createdAt.toISOString().split("T")[0],
      };
    });

    // 3. Return the exact structure the Admin Dashboard expects
    return {
      metrics: {
        totalMonthlyPremium: totalMonthlyPremiumCents / 100,
        activePolicies: activePoliciesCount,
        pendingCorporatePayments: pendingCorporateCount
      },
      policies: mappedPolicies
    };
  }
}
