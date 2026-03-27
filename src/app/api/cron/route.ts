import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSnapshot } from "@/lib/snapshot";
import { sendEmail } from "@/lib/email";
import { buildEmailHTML } from "@/lib/email-template";
import { formatYearMonth, getPreviousMonth, FISCAL_MONTHS } from "@/lib/types";
import type { TeamWithMembers, ProductInfo, ComparisonEntry } from "@/lib/types";

async function runCronJob() {
  // Determine current month (YYYY-MM format)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Only process if the month is within the fiscal year
  if (!FISCAL_MONTHS.includes(currentMonth as typeof FISCAL_MONTHS[number])) {
    return NextResponse.json({
      skipped: true,
      reason: `${currentMonth} is outside the fiscal year scope`,
    });
  }

  const previousMonth = getPreviousMonth(currentMonth);

  // Step 1: Create snapshot
  const snapshotCount = await createSnapshot(currentMonth);
  console.log(`[Cron] Snapshot created: ${snapshotCount} entries`);

  // Step 2: Build comparison data (current month vs previous month plans)
  let comparisonData: ComparisonEntry[] = [];
  if (previousMonth) {
    const currentPlans = await prisma.mMPlan.findMany({
      where: { yearMonth: currentMonth },
      include: { member: { include: { team: true } }, product: true },
    });
    const previousPlans = await prisma.mMPlan.findMany({
      where: { yearMonth: previousMonth },
    });

    const prevMap = new Map<string, number>();
    previousPlans.forEach((p) => prevMap.set(`${p.memberId}-${p.productId}`, p.mmValue));

    const seenKeys = new Set<string>();
    for (const plan of currentPlans) {
      const key = `${plan.memberId}-${plan.productId}`;
      seenKeys.add(key);
      const prevValue = prevMap.get(key) || 0;
      comparisonData.push({
        memberId: plan.memberId,
        memberName: plan.member.name,
        teamId: plan.member.teamId,
        teamName: plan.member.team.name,
        productId: plan.productId,
        productName: plan.product.name,
        currentValue: plan.mmValue,
        previousValue: prevValue,
        delta: Math.round((plan.mmValue - prevValue) * 100) / 100,
      });
    }

    for (const plan of previousPlans) {
      const key = `${plan.memberId}-${plan.productId}`;
      if (!seenKeys.has(key)) {
        const member = await prisma.member.findUnique({
          where: { id: plan.memberId },
          include: { team: true },
        });
        const product = await prisma.product.findUnique({
          where: { id: plan.productId },
        });
        if (member && product) {
          comparisonData.push({
            memberId: plan.memberId,
            memberName: member.name,
            teamId: member.teamId,
            teamName: member.team.name,
            productId: plan.productId,
            productName: product.name,
            currentValue: 0,
            previousValue: plan.mmValue,
            delta: -plan.mmValue,
          });
        }
      }
    }
  }

  // Step 3: Fetch master data for email template
  const [teams, products] = await Promise.all([
    prisma.team.findMany({
      orderBy: { sortOrder: "asc" },
      include: { members: { orderBy: { sortOrder: "asc" } } },
    }) as Promise<TeamWithMembers[]>,
    prisma.product.findMany({
      orderBy: { sortOrder: "asc" },
    }) as Promise<ProductInfo[]>,
  ]);

  // Step 4: Build email
  const html = buildEmailHTML({
    currentMonth,
    teams,
    products,
    comparisonData,
  });

  const subject = `[MM Plan] ${formatYearMonth(currentMonth)} 계획 업데이트`;

  // Step 5: Get active recipients and send
  const recipients = await prisma.emailRecipient.findMany({
    where: { active: true },
  });

  if (recipients.length === 0) {
    return NextResponse.json({
      success: true,
      warning: "No active recipients",
      snapshotCount,
    });
  }

  await sendEmail(
    recipients.map((r) => r.email),
    subject,
    html
  );

  console.log(`[Cron] Email sent to ${recipients.length} recipients for ${currentMonth}`);

  return NextResponse.json({
    success: true,
    snapshotCount,
    recipientCount: recipients.length,
    month: currentMonth,
  });
}

// Vercel Cron calls GET
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await runCronJob();
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

// Manual trigger via POST
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await runCronJob();
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
