import { pgTable, text, timestamp, boolean, uuid, integer, jsonb } from "drizzle-orm/pg-core";
// IMPORTANT: Adjust these import paths to match your actual schema file locations
import { facilities } from "./facilities"; 
import { professionals } from "./professionals";

export const insurancePolicies = pgTable("insurance_policies", {
  // 1. Core Identification
  id: uuid("id").primaryKey().defaultRandom(),
  policyNumber: text("policy_number").notNull().unique(), // e.g., AFL-INS-8F2D1A
  provider: text("provider").notNull(), // e.g., "Afyalink Master Cover", "Jubilee", "Britam"
  
  // 2. Policy Details
  policyType: text("policy_type").notNull(), // "individual" | "family" | "indemnity" | "corporate"
  tier: text("tier").notNull(), // "basic" | "standard" | "premium"
  
  // We store currency as integers (cents/kobos) to completely eliminate floating-point math errors.
  premiumCents: integer("premium_cents").notNull(), 
  
  isActive: boolean("is_active").default(true).notNull(),
  
  // Micro-Insurance Fields
  financialKyc: jsonb("financial_kyc"),
  paymentFrequency: text("payment_frequency"),
  nextDueDate: timestamp("next_due_date"),
  penaltyCents: integer("penalty_cents").default(0),
  
  // ==========================================
  // 3. POLYMORPHIC OWNERSHIP
  // Only one set of these fields will be populated per row.
  // ==========================================
  
  // A. Public B2C Customers (No Afyalink account required)
  publicOwnerName: text("public_owner_name"),
  publicOwnerPhone: text("public_owner_phone"),
  publicOwnerEmail: text("public_owner_email"),
  
  // B. Verified Clinical Professionals & Students
  professionalId: uuid("professional_id").references(() => professionals.id),
  
  // C. Verified Healthcare Facilities
  facilityId: uuid("facility_id").references(() => facilities.id),

  // 4. Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
