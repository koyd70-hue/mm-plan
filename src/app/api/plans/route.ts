import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearMonth = searchParams.get("yearMonth");

  if (!yearMonth) {
    return NextResponse.json({ error: "yearMonth is required" }, { status: 400 });
  }

  const plans = await prisma.mMPlan.findMany({
    where: { yearMonth },
    select: {
      memberId: true,
      productId: true,
      yearMonth: true,
      mmValue: true,
    },
  });

  return NextResponse.json(plans);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { entries } = body as {
    entries: Array<{
      memberId: number;
      productId: number;
      yearMonth: string;
      mmValue: number;
    }>;
  };

  // Use a transaction for batch upsert
  const results = await prisma.$transaction(
    entries.map((entry) =>
      prisma.mMPlan.upsert({
        where: {
          memberId_productId_yearMonth: {
            memberId: entry.memberId,
            productId: entry.productId,
            yearMonth: entry.yearMonth,
          },
        },
        update: { mmValue: entry.mmValue },
        create: {
          memberId: entry.memberId,
          productId: entry.productId,
          yearMonth: entry.yearMonth,
          mmValue: entry.mmValue,
        },
      })
    )
  );

  return NextResponse.json({ count: results.length });
}
