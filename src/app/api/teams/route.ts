import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const teams = await prisma.team.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      members: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  return NextResponse.json(teams);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, sortOrder } = body;

  const team = await prisma.team.create({
    data: { name, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(team, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, sortOrder } = body;

  const team = await prisma.team.update({
    where: { id },
    data: { name, sortOrder },
  });
  return NextResponse.json(team);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
