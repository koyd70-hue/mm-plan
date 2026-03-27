import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildEmailHTML } from "@/lib/email-template";
import { getComparison } from "@/lib/snapshot";
import { formatYearMonth, getPreviousMonth, FISCAL_MONTHS } from "@/lib/types";
import type { TeamWithMembers, ProductInfo } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { yearMonth, testEmail } = body as {
    yearMonth?: string;
    testEmail?: string;
  };

  const currentMonth = yearMonth || FISCAL_MONTHS[0];
  const previousMonth = getPreviousMonth(currentMonth);

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

  // Get comparison data
  const comparisonData = previousMonth
    ? await getComparison(currentMonth, previousMonth)
    : [];

  // Build email
  const html = buildEmailHTML({
    currentMonth,
    teams,
    products,
    comparisonData,
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
    console.error("Email send failed:", error);
    return NextResponse.json(
      { error: "이메일 발송에 실패했습니다." },
      { status: 500 }
    );
  }
}
