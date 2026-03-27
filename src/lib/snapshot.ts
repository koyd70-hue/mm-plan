import { prisma } from "./prisma";
import { FISCAL_MONTHS } from "./types";
import type { ComparisonEntry } from "./types";

export async function createSnapshot(snapshotMonth: string): Promise<number> {
  // Delete existing snapshot for this month (idempotent)
  await prisma.mMPlanSnapshot.deleteMany({
    where: { snapshotMonth },
  });

  // Copy all current plan data for all fiscal months
  const plans = await prisma.mMPlan.findMany({
    where: {
      yearMonth: { in: [...FISCAL_MONTHS] },
    },
  });

  if (plans.length === 0) return 0;

  await prisma.mMPlanSnapshot.createMany({
    data: plans.map((p) => ({
      memberId: p.memberId,
      productId: p.productId,
      yearMonth: p.yearMonth,
      mmValue: p.mmValue,
      snapshotMonth,
    })),
  });

  return plans.length;
}

export async function getComparison(
  currentMonth: string,
  previousSnapshotMonth: string
): Promise<ComparisonEntry[]> {
  // Fetch current plans for this month
  const currentPlans = await prisma.mMPlan.findMany({
    where: { yearMonth: currentMonth },
    include: {
      member: { include: { team: true } },
      product: true,
    },
  });

  // Fetch snapshot for comparison
  const snapshots = await prisma.mMPlanSnapshot.findMany({
    where: {
      yearMonth: currentMonth,
      snapshotMonth: previousSnapshotMonth,
    },
  });

  const snapshotMap = new Map<string, number>();
  snapshots.forEach((s) => {
    snapshotMap.set(`${s.memberId}-${s.productId}`, s.mmValue);
  });

  // Build comparison entries from current plans
  const entries: ComparisonEntry[] = [];
  const seenKeys = new Set<string>();

  for (const plan of currentPlans) {
    const key = `${plan.memberId}-${plan.productId}`;
    seenKeys.add(key);
    const previousValue = snapshotMap.get(key) || 0;
    const delta = Math.round((plan.mmValue - previousValue) * 100) / 100;

    entries.push({
      memberId: plan.memberId,
      memberName: plan.member.name,
      teamId: plan.member.teamId,
      teamName: plan.member.team.name,
      productId: plan.productId,
      productName: plan.product.name,
      currentValue: plan.mmValue,
      previousValue,
      delta,
    });
  }

  // Add entries that exist only in snapshot (removed in current)
  for (const snapshot of snapshots) {
    const key = `${snapshot.memberId}-${snapshot.productId}`;
    if (!seenKeys.has(key)) {
      const member = await prisma.member.findUnique({
        where: { id: snapshot.memberId },
        include: { team: true },
      });
      const product = await prisma.product.findUnique({
        where: { id: snapshot.productId },
      });
      if (member && product) {
        entries.push({
          memberId: snapshot.memberId,
          memberName: member.name,
          teamId: member.teamId,
          teamName: member.team.name,
          productId: snapshot.productId,
          productName: product.name,
          currentValue: 0,
          previousValue: snapshot.mmValue,
          delta: -snapshot.mmValue,
        });
      }
    }
  }

  return entries;
}
