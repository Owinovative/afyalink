import { Request, Response } from "express"; // Assuming Express, adjust if using Next.js Route Handlers or Fastify
import { GeneratePublicQuote } from "../../Application/Insurance/GeneratePublicQuote";

export class InsuranceController {
  
  public async generatePublicQuote(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, phone, dob, coverType, dependents, tier } = req.body;

      // 1. Guard Clause: Strict Input Validation
      if (!name || !email || !phone || !coverType || !tier) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required underwriting fields. Please provide name, email, phone, coverType, and tier." 
        });
      }

      // 2. Instantiate and execute the Use Case
      const useCase = new GeneratePublicQuote();
      
      const policyDetails = await useCase.execute({
        name,
        email,
        phone,
        dob,
        coverType,
        dependents: parseInt(dependents || "0", 10),
        tier
      });

      // 3. Return the exact JSON structure the frontend expects
      return res.status(201).json({
        success: true,
        message: "Insurance quote generated and policy recorded.",
        data: policyDetails
      });

    } catch (error) {
      console.error("[InsuranceController] Failed to generate quote:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Internal Server Error during underwriting calculation." 
      });
    }
  }
}
