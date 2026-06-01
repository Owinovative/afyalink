import { Pool } from "@neondatabase/serverless";

// 1. Verify the environment variable exists so the app fails early if it's missing
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from your environment variables.");
}

// 2. Initialize the serverless connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 3. Create a clean helper function to execute SQL queries securely
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error("Database Query Error:", error);
    throw error;
  } finally {
    // Always release the client back to the pool to prevent memory leaks
    client.release();
  }
}
