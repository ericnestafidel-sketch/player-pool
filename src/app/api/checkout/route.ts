import { NextResponse } from "next/server";
import { playerSignupOpen } from "@/lib/launch";

export async function POST() {
  if (!playerSignupOpen()) {
    return NextResponse.json({ error: "Player sign-up is not open yet." }, { status: 403 });
  }
  return NextResponse.json({ error: "Start checkout from your parent page." }, { status: 400 });
}
