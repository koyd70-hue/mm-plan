import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSnapshot } from "@/lib/snapshot";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const snapshotMonth = searchParams.get("snapshotMonth");

  if (!snapshotMonth) {
    // Return list of available snapshot months
    const snapshots = await prisma.mMPlanSnapshot.findMany({
      select: { snapshotMonth: true },
      distinct: ["snapshotMonth"],
      orderBy: { snapshotMonth: "desc" },
    });
    return NextResponse.json(snapshots.map((s) => s.snapshotMonth));
  }

  const data = await prisma.mMPlanSnapshot.findMany({
    where: { snapshotMonth },
    select: {
      memberId: true,
      productId: true,
      yearMonth: true,
      mmValue: true,
    },
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { snapshotMonth } = body;

  if (!snapshotMonth) {
    return NextResponse.json(
      { error: "snapshotMonth is required" },
      { status: 400 }
    );
  }

  const count = await createSnapshot(snapshotMonth);
  return NextResponse.json({ count, snapshotMonth });
}
