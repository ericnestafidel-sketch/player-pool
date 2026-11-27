import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Paid listings are not open yet." }, { status: 403 });
}
