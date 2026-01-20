"use client";

import { useEffect, useMemo, useState } from "react";

type Kategori = { id: number; name: string; emoji: string | null; color: string | null };
type Utgift = {
  id: number;
  amount: string;
  currency: string;
  note: string | null;
  spent_on: string;
  category_id: number | null;
  category_name: string | null;
  category_emoji: string | null;
  category_color: string | null;
};

type Summary = {
  today: string;
  month: string;
  categories: string;
  todayDate: string;
  monthStart: string;
};

function brukOwner() {
  const [owner, setOwner] = useState<string>("");

  useEffect(() => {
    const key = "bh_owner";
    let v = localStorage.getItem(key);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(key, v);
    }
    setOwner(v);
  }, []);

  return owner;
}

async function api(owner: string, path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "Content-Type": "application/json",
      "x-owner": owner,
    },
    cache: "no-store",
  });
  return res;
}

export default function BudsjettSide() {
  const owner = brukOwner();
  const [fane, setFane] = useState<"oversikt" | "utgifter" | "kategorier">("oversikt");

  const [kategorier, setKategorier] = useState<Kategori[]>([]);
  const [utgifter, setUtgifter] = useState<Utgift[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [nyKategori, setNyKategori] = useState({ navn: "", emoji: "🍽️", farge: "#4f46e5" });
  const [nyUtgift, setNyUtgift] = useState({ belop: "", dato: "", kategoriId: 0, notat: "" });

  const kategoriValg = useMemo(() => {
    const first = kategorier[0]?.id ?? 0;
    return first;
  }, [kategorier]);

  async function lastAlt() {
    if (!owner) return;

    const [c, t, s] = await Promise.all([
      api(owner, "/api/categories").then((r) => r.json()),
      api(owner, "/api/transactions?limit=80").then((r) => r.json()),
      api(owner, "/api/summary").then((r) => r.json()),
    ]);

    setKategorier(c.kategorier || []);
    setUtgifter(t.utgifter || []);
    setSummary(s.summary || null);
  }

  useEffect(() => {
    lastAlt();
  }, [owner]);

  useEffect(() => {
    if (!nyUtgift.dato && summary?.todayDate) setNyUtgift((x) => ({ ...x, dato: summary.todayDate }));
  }, [summary]);

  useEffect(() => {
    if (!nyUtgift.kategoriId && kategoriValg) setNyUtgift((x) => ({ ...x, kategoriId: kategoriValg }));
  }, [kategoriValg]);

  async function leggTilKategori() {
    if (!owner) return;
    const navn = nyKategori.navn.trim();
    if (!navn) return;

    const res = await api(owner, "/api/categories", {
      method: "POST",
      body: JSON.stringify({ navn, emoji: nyKategori.emoji, farge: nyKategori.farge }),
    });

    if (res.ok) {
      setNyKategori((x) => ({ ...x, navn: "" }));
      await lastAlt();
      setFane("kategorier");
    }
  }

  async function slettKategoriId(id: number) {
    if (!owner) return;
    const res = await api(owner, `/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) await lastAlt();
  }

  async function leggTilUtgift() {
    if (!owner) return;

    const belop = Number(nyUtgift.belop);
    if (!Number.isFinite(belop) || belop <= 0) return;

    const res = await api(owner, "/api/transactions", {
      method: "POST",
      body: JSON.stringify({
        belop,
        dato: nyUtgift.dato,
        kategoriId: nyUtgift.kategoriId || null,
        notat: nyUtgift.notat || null,
        valuta: "NOK",
      }),
    });

    if (res.ok) {
      setNyUtgift((x) => ({ ...x, belop: "", notat: "" }));
      await lastAlt();
      setFane("utgifter");
    }
  }

  async function slettUtgiftId(id: number) {
    if (!owner) return;
    const res = await api(owner, `/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) await lastAlt();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mt-6 flex flex-col gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xl font-semibold">Budsjett</div>
              <div className="text-sm text-[var(--muted)]">Kategorier, utgifter og oversikt</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFane("oversikt")}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  fane === "oversikt" ? "border-transparent bg-black/10 dark:bg-white/10" : "border-[var(--border)]"
                }`}
              >
                Oversikt
              </button>
              <button
                onClick={() => setFane("utgifter")}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  fane === "utgifter" ? "border-transparent bg-black/10 dark:bg-white/10" : "border-[var(--border)]"
                }`}
              >
                Utgifter
              </button>
              <button
                onClick={() => setFane("kategorier")}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  fane === "kategorier" ? "border-transparent bg-black/10 dark:bg-white/10" : "border-[var(--border)]"
                }`}
              >
                Kategorier
              </button>
            </div>
          </div>
        </div>

        {fane === "oversikt" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="text-sm text-[var(--muted)]">I dag</div>
              <div className="mt-1 text-2xl font-semibold">{summary ? `${summary.today} NOK` : "—"}</div>
              <div className="mt-2 text-xs text-[var(--muted)]">{summary ? summary.todayDate : ""}</div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="text-sm text-[var(--muted)]">Denne måneden</div>
              <div className="mt-1 text-2xl font-semibold">{summary ? `${summary.month} NOK` : "—"}</div>
              <div className="mt-2 text-xs text-[var(--muted)]">{summary ? `Fra ${summary.monthStart}` : ""}</div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="text-sm text-[var(--muted)]">Kategorier</div>
              <div className="mt-1 text-2xl font-semibold">{summary ? summary.categories : "—"}</div>
              <div className="mt-2 text-xs text-[var(--muted)]">Legg til egne kategorier</div>
            </div>

            <div className="lg:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="text-base font-semibold">Legg til utgift</div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="md:col-span-1">
                  <div className="text-xs text-[var(--muted)]">Beløp</div>
                  <input
                    value={nyUtgift.belop}
                    onChange={(e) => setNyUtgift((x) => ({ ...x, belop: e.target.value }))}
                    inputMode="decimal"
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
                    placeholder="250"
                  />
                </div>

                <div className="md:col-span-1">
                  <div className="text-xs text-[var(--muted)]">Dato</div>
                  <input
                    value={nyUtgift.dato}
                    onChange={(e) => setNyUtgift((x) => ({ ...x, dato: e.target.value }))}
                    type="date"
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
                  />
                </div>

                <div className="md:col-span-1">
                  <div className="text-xs text-[var(--muted)]">Kategori</div>
                  <select
                    value={nyUtgift.kategoriId}
                    onChange={(e) => setNyUtgift((x) => ({ ...x, kategoriId: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
                  >
                    {kategorier.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.emoji ? `${k.emoji} ` : ""}{k.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1">
                  <div className="text-xs text-[var(--muted)]">Notat</div>
                  <input
                    value={nyUtgift.notat}
                    onChange={(e) => setNyUtgift((x) => ({ ...x, notat: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
                    placeholder="valgfritt"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={leggTilUtgift}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 font-semibold"
                >
                  Lagre
                </button>
                <button
                  onClick={() => setFane("utgifter")}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-[var(--muted)]"
                >
                  Se utgifter
                </button>
                <button
                  onClick={() => setFane("kategorier")}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-[var(--muted)]"
                >
                  Administrer kategorier
                </button>
              </div>
            </div>
          </div>
        )}

        {fane === "utgifter" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-base font-semibold">Siste utgifter</div>
              <button onClick={lastAlt} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
                Oppdater
              </button>
            </div>

            <div className="mt-4 divide-y divide-[var(--border)]">
              {utgifter.length === 0 && <div className="py-8 text-sm text-[var(--muted)]">Ingen utgifter ennå.</div>}

              {utgifter.map((u) => (
                <div key={u.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)]"
                      style={{ background: u.category_color || "transparent" }}
                    >
                      <span className="text-lg">{u.category_emoji || "💸"}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        {u.category_name || "Uten kategori"}{" "}
                        <span className="text-[var(--muted)] font-normal">· {u.spent_on}</span>
                      </div>
                      <div className="text-xs text-[var(--muted)]">{u.note || ""}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-sm font-semibold">{u.amount} {u.currency}</div>
                    <button
                      onClick={() => slettUtgiftId(u.id)}
                      className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]"
                    >
                      Slett
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {fane === "kategorier" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="text-base font-semibold">Legg til kategori</div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <div className="text-xs text-[var(--muted)]">Navn</div>
                  <input
                    value={nyKategori.navn}
                    onChange={(e) => setNyKategori((x) => ({ ...x, navn: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
                    placeholder="mat"
                  />
                </div>

                <div>
                  <div className="text-xs text-[var(--muted)]">Emoji</div>
                  <input
                    value={nyKategori.emoji}
                    onChange={(e) => setNyKategori((x) => ({ ...x, emoji: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
                    placeholder="🍽️"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-[var(--muted)]">Farge</div>
                  <input
                    value={nyKategori.farge}
                    onChange={(e) => setNyKategori((x) => ({ ...x, farge: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
                    placeholder="#4f46e5"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={leggTilKategori}
                    className="w-full rounded-xl border border-[var(--border)] px-4 py-2 font-semibold"
                  >
                    Lagre
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-base font-semibold">Kategorier</div>
                <button onClick={lastAlt} className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
                  Oppdater
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                {kategorier.length === 0 && <div className="py-8 text-sm text-[var(--muted)]">Ingen kategorier ennå.</div>}

                {kategorier.map((k) => (
                  <div key={k.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)]"
                        style={{ background: k.color || "transparent" }}
                      >
                        <span className="text-lg">{k.emoji || "🏷️"}</span>
                      </div>
                      <div className="text-sm font-semibold">{k.name}</div>
                    </div>

                    <button
                      onClick={() => slettKategoriId(k.id)}
                      className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]"
                    >
                      Slett
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
