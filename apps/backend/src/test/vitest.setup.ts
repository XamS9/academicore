import { config } from "dotenv";
import path from "path";

// Load backend .env before any module imports Prisma / env validation.
config({ path: path.resolve(__dirname, "..", "..", ".env") });
