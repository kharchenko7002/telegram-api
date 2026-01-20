import { NextResponse } from "next/server";
import { hentUtgifter, opprettUtgift } from "app/lib/db";

export const runtime = "nodejs";

function ownerFra(req: Request) {
  return req.headers.get("x-owner")?.trim() || "";
}

export async function GET(req: Request) {
  const owner = ownerFra(req);
  if (!owner) return NextResponse.json({ feil: "owner mangler" }, { status: 400 });

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || "50");
  const utgifter = await hentUtgifter(owner, Number.isFinite(limit) ? Math.max(1, Math.min(limit, 200)) : 50);

  return NextResponse.json({ utgifter });
}

export async function POST(req: Request) {
  const owner = ownerFra(req);
  if (!owner) return NextResponse.json({ feil: "owner mangler" }, { status: 400 });

  const { belop, dato, kategoriId, notat, valuta } = await req.json();

  const amount = Number(belop);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ feil: "ugyldig beløp" }, { status: 400 });
  }

  const utgift = await opprettUtgift({
    owner,
    amount,
    spent_on: typeof dato === "string" ? dato : undefined,
    category_id: typeof kategoriId === "number" ? kategoriId : null,
    note: typeof notat === "string" ? notat : null,
    currency: typeof valuta === "string" ? valuta : "NOK",
  });

  return NextResponse.json({ utgift });
}
