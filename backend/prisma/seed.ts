import "dotenv/config";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { seedDemoEnvironment } from "./seedDemoEnvironment.js";

async function main() {
  await seedDemoEnvironment(prisma);
  console.log("");
  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
