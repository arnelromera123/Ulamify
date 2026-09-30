import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(path.join(__dirname, "../../.env"));
  } catch {}
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Please create a .env file in the root folder or set DATABASE_URL in your terminal.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
