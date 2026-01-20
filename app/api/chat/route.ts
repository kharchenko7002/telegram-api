import { NextResponse } from "next/server";
import { botSvar } from "@/lib/bot";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { melding } = await req.json();

  if (!melding || typeof melding !== "string") {
    return NextResponse.json({ feil: "melding mangler" }, { status: 400 });
  }

  const svar = botSvar(melding);
  return NextResponse.json({ svar });
}
