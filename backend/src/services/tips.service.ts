import { prisma } from "../prisma.js";

export { createPaymentIntent, handlePaymentSuccess } from "./stripe.service.js";

export interface TipForEmployee {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

export async function getTipsByEmployeeId(employeeId: string): Promise<TipForEmployee[]> {
  const tips = await prisma.transaction.findMany({
    where: { employeeId, status: "success" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
    },
  });
  return tips.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));
}
