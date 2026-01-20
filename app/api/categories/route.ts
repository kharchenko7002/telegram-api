import { NextResponse } from "next/server";
import { hentKategorier, opprettKategori } from "app/lib/db";

export const runtime = "nodejs";

function ownerFra(req: Request) {
  return req.headers.get("x-owner")?.trim() || "";
}

export async function GET(req: Request) {
  const owner = ownerFra(req);
  if (!owner) return NextResponse.json({ feil: "owner mangler" }, { status: 400 });
  const kategorier = await hentKategorier(owner);
  return NextResponse.json({ kategorier });
}

export async function POST(req: Request) {
  const owner = ownerFra(req);
  if (!owner) return NextResponse.json({ feil: "owner mangler" }, { status: 400 });

  const { navn, emoji, farge } = await req.json();
  if (!navn || typeof navn !== "string") {
    return NextResponse.json({ feil: "navn mangler" }, { status: 400 });
  }

  const kategori = await opprettKategori(owner, navn, emoji ?? null, farge ?? null);
  return NextResponse.json({ kategori });
}
