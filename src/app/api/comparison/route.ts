import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ComparisonEntry } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const current = searchParams.get("current");
  const previous = searchParams.get("previous");

  if (!current || !previous) {
    return NextResponse.json(
      { error: "current and previous query params are required" },
      { status: 400 }
    );
  }

  // Fetch current month's plans
  const currentPlans = await prisma.mMPlan.findMany({
    where: { yearMonth: current },
    include: {
      member: { include: { team: true } },
      product: true,
    },
  });

  // Fetch previous month's plans
  const previousPlans = await prisma.mMPlan.findMany({
    where: { yearMonth: previous },
    include: {
      member: { include: { team: true } },
      product: true,
    },
  });

  // Build previous month lookup
  const prevMap = new Map<string, number>();
  previousPlans.forEach((p) => {
    prevMap.set(`${p.memberId}-${p.productId}`, p.mmValue);
  });

  const entries: ComparisonEntry[] = [];
  const seenKeys = new Set<string>();

  // Entries from current month
  for (const plan of currentPlans) {
    const key = `${plan.memberId}-${plan.productId}`;
    seenKeys.add(key);
    const previousValue = prevMap.get(key) || 0;
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

  // Entries that exist only in previous month (removed in current)
  for (const plan of previousPlans) {
    const key = `${plan.memberId}-${plan.productId}`;
    if (!seenKeys.has(key)) {
      entries.push({
        memberId: plan.memberId,
        memberName: plan.member.name,
        teamId: plan.member.teamId,
        teamName: plan.member.team.name,
        productId: plan.productId,
        productName: plan.product.name,
        currentValue: 0,
        previousValue: plan.mmValue,
        delta: -plan.mmValue,
      });
    }
  }

  return NextResponse.json(entries);
}
