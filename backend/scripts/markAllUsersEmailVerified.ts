import "dotenv/config";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";

async function main() {
  const r = await prisma.user.updateMany({
    where: { emailVerified: false },
    data: { emailVerified: true },
  });
  console.info("[markAllUsersEmailVerified] updated rows:", r.count);
}

main()
  .catch((e) => {
    console.error("[markAllUsersEmailVerified] failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });

