import { NextRequest, NextResponse } from "next/server";
import { getComparison } from "@/lib/snapshot";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const current = searchParams.get("current");
  const previous = searchParams.get("previous");

  if (!current || !previous) {
    return NextResponse.json(
      { error: "current and previous query params are required" },
      { status: 400 }
    );
  }

  const entries = await getComparison(current, previous);
  return NextResponse.json(entries);
}
