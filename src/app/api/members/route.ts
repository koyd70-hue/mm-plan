import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const members = await prisma.member.findMany({
    orderBy: [{ team: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { team: true },
  });
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, teamId, sortOrder } = body;

  const member = await prisma.member.create({
    data: { name, email, teamId, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(member, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, email, teamId, sortOrder } = body;

  const member = await prisma.member.update({
    where: { id },
    data: { name, email, teamId, sortOrder },
  });
  return NextResponse.json(member);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
