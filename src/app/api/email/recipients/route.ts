import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const recipients = await prisma.emailRecipient.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(recipients);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, active } = body;

  const recipient = await prisma.emailRecipient.create({
    data: { name, email, active: active ?? true },
  });
  return NextResponse.json(recipient, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, email, active } = body;

  const recipient = await prisma.emailRecipient.update({
    where: { id },
    data: { name, email, active },
  });
  return NextResponse.json(recipient);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  await prisma.emailRecipient.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
