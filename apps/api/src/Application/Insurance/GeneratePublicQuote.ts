import { db } from "../../Infrastructure/Persistence/database"; // Adjust to your actual DB export
import { insurancePolicies } from "../../Infrastructure/Persistence/schema/insurance";
import { crypto } from "crypto";

// Define what this Use Case expects
export interface GenerateQuoteDTO {
  name: string;
  email: string;
  phone: string;
  dob: string;
  coverType: "individual" | "family";
  dependents: number;
  tier: "basic" | "standard" | "premium";
}

export class GeneratePublicQuote {
  
  // The Underwriting Engine (Business Rules)
  private calculatePremium(tier: string, coverType: string, dependents: number): number {
    let basePrice = 2000; // Default Basic
    
    if (tier === "standard") basePrice = 4500;
    if (tier === "premium") basePrice = 8500;

    if (coverType === "family") {
      basePrice += dependents * 1500;
    }
    
    // Always return financial values in smallest currency unit (cents/kobos)
    return basePrice * 100;
  }

  public async execute(data: GenerateQuoteDTO) {
    // 1. Calculate Premium
    const finalPremiumCents = this.calculatePremium(data.tier, data.coverType, data.dependents);

    // 2. Generate Cryptographic Policy ID
    const uniqueHash = crypto.randomBytes(3).toString("hex").toUpperCase();
    const policyNumber = `AFL-INS-${uniqueHash}`;

    // 3. Persist to Database using Drizzle ORM
    const [newPolicy] = await db.insert(insurancePolicies).values({
      policyNumber,
      provider: "Afyalink Master Cover",
      policyType: data.coverType,
      tier: data.tier,
      premiumCents: finalPremiumCents,
      publicOwnerName: data.name,
      publicOwnerEmail: data.email,
      publicOwnerPhone: data.phone,
      isActive: true,
    }).returning();

    // 4. Return clean data object back to the Controller
    return {
      policyNumber: newPolicy.policyNumber,
      monthlyPremium: newPolicy.premiumCents / 100, // Convert back to readable format for the frontend
      type: newPolicy.policyType,
      tier: newPolicy.tier
    };
  }
}
