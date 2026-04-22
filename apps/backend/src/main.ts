import "./config/env"; // validate env vars first
import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./shared/prisma.client";
import { runSeed } from "./shared/seed";

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("Database connected");

    // Auto-seed when not in production and DB is empty
    if (env.NODE_ENV !== "production") {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log("Empty database detected — running auto-seed…");
        await runSeed(prisma);
      }
    }

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
