import { neon, neonConfig } from '@neondatabase/serverless';

// Optional: If you are deploying to an edge environment (like Cloudflare Workers or Vercel Edge), 
// this configures Neon to use WebSocket connections.
neonConfig.fetchConnectionCache = true;

const sqlString = process.env.DATABASE_URL;

if (!sqlString) {
  throw new Error("DATABASE_URL is not defined in the environment variables.");
}

// This creates a secure, serverless connection pool to your Neon database
export const db = neon(sqlString);
