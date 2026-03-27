import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, sortOrder } = body;

  const product = await prisma.product.create({
    data: { name, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(product, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, sortOrder } = body;

  const product = await prisma.product.update({
    where: { id },
    data: { name, sortOrder },
  });
  return NextResponse.json(product);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
