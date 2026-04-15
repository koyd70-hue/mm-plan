import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildEmailHTML } from "@/lib/email-template";
import { getComparison } from "@/lib/snapshot";
import { formatYearMonth, getPreviousMonth, FISCAL_MONTHS } from "@/lib/types";
import type { TeamWithMembers, ProductInfo, ComparisonEntry } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { yearMonth, testEmail } = body as {
    yearMonth?: string;
    testEmail?: string;
  };

  const currentMonth = yearMonth || FISCAL_MONTHS[0];
  const previousMonth = getPreviousMonth(currentMonth);
  const showComparison = previousMonth !== null;

  // Fetch master data
  const [teams, products] = await Promise.all([
    prisma.team.findMany({
      orderBy: { sortOrder: "asc" },
      include: { members: { orderBy: { sortOrder: "asc" } } },
    }) as Promise<TeamWithMembers[]>,
    prisma.product.findMany({
      orderBy: { sortOrder: "asc" },
    }) as Promise<ProductInfo[]>,
  ]);

  // Build data for email template
  let comparisonData: ComparisonEntry[];
  if (showComparison) {
    // 5월 이후: 전월 비교 데이터
    comparisonData = await getComparison(currentMonth, previousMonth!);
  } else {
    // 4월 (첫 번째 달): 현재 계획 현황만 표시
    const currentPlans = await prisma.mMPlan.findMany({
      where: { yearMonth: currentMonth },
      include: { member: { include: { team: true } }, product: true },
    });
    comparisonData = currentPlans.map((plan) => ({
      memberId: plan.memberId,
      memberName: plan.member.name,
      teamId: plan.member.teamId,
      teamName: plan.member.team.name,
      productId: plan.productId,
      productName: plan.product.name,
      currentValue: plan.mmValue,
      previousValue: 0,
      delta: 0,
    }));
  }

  // Build email
  const html = buildEmailHTML({
    currentMonth,
    teams,
    products,
    comparisonData,
    showComparison,
  });

  const subject = `[MM Plan] ${formatYearMonth(currentMonth)} 계획 업데이트`;

  // Determine recipients
  let recipients: string[];
  if (testEmail) {
    recipients = [testEmail];
  } else {
    const activeRecipients = await prisma.emailRecipient.findMany({
      where: { active: true },
    });
    recipients = activeRecipients.map((r) => r.email);
  }

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "수신자가 없습니다." },
      { status: 400 }
    );
  }

  try {
    await sendEmail(recipients, subject, html);
    return NextResponse.json({
      success: true,
      recipientCount: recipients.length,
      subject,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Email send failed:", message);
    return NextResponse.json(
      { error: `이메일 발송 실패: ${message}` },
      { status: 500 }
    );
  }
}
