import { NextResponse } from "next/server";
import { slettKategori } from "app/lib/db";

export const runtime = "nodejs";

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  const owner = req.headers.get("x-owner")?.trim() || "";
  if (!owner) return NextResponse.json({ feil: "owner mangler" }, { status: 400 });

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ feil: "ugyldig id" }, { status: 400 });

  await slettKategori(owner, id);
  return NextResponse.json({ ok: true });
}
