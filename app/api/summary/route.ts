import { NextResponse } from "next/server";
import { hentOppsummering } from "app/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const owner = req.headers.get("x-owner")?.trim() || "";
  if (!owner) return NextResponse.json({ feil: "owner mangler" }, { status: 400 });

  const summary = await hentOppsummering(owner);
  return NextResponse.json({ summary });
}
