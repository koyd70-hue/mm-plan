import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSnapshot, getComparison } from "@/lib/snapshot";
import { sendEmail } from "@/lib/email";
import { buildEmailHTML } from "@/lib/email-template";
import { formatYearMonth, getPreviousMonth, FISCAL_MONTHS } from "@/lib/types";
import type { TeamWithMembers, ProductInfo } from "@/lib/types";

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  try {
    // Step 1: Create snapshot
    const snapshotCount = await createSnapshot(currentMonth);
    console.log(`[Cron] Snapshot created: ${snapshotCount} entries`);

    // Step 2: Build comparison data
    const comparisonData = previousMonth
      ? await getComparison(currentMonth, previousMonth)
      : [];

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

    console.log(
      `[Cron] Email sent to ${recipients.length} recipients for ${currentMonth}`
    );

    return NextResponse.json({
      success: true,
      snapshotCount,
      recipientCount: recipients.length,
      month: currentMonth,
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
