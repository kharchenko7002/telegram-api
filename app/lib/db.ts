import { sql } from "@vercel/postgres";

export type Kategori = {
  id: number;
  name: string;
  emoji: string | null;
  color: string | null;
};

export type Utgift = {
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

export async function hentKategorier(owner: string) {
  const r = await sql<Kategori>`
    select id, name, emoji, color
    from categories
    where owner = ${owner}
    order by name asc
  `;
  return r.rows;
}

export async function opprettKategori(owner: string, name: string, emoji?: string | null, color?: string | null) {
  const n = name.trim();
  const e = emoji?.trim() || null;
  const c = color?.trim() || null;

  const r = await sql<Kategori>`
    insert into categories (owner, name, emoji, color)
    values (${owner}, ${n}, ${e}, ${c})
    on conflict (owner, name)
    do update set emoji = excluded.emoji, color = excluded.color
    returning id, name, emoji, color
  `;
  return r.rows[0];
}

export async function slettKategori(owner: string, id: number) {
  await sql`delete from categories where owner = ${owner} and id = ${id}`;
}

export async function opprettUtgift(args: {
  owner: string;
  amount: number;
  spent_on?: string;
  category_id?: number | null;
  note?: string | null;
  currency?: string;
}) {
  const currency = args.currency || "NOK";
  const spentOn = args.spent_on || new Date().toISOString().slice(0, 10);
  const note = args.note?.trim() || null;
  const categoryId = args.category_id ?? null;

  const r = await sql<Utgift>`
    insert into transactions (owner, category_id, amount, currency, note, spent_on)
    values (${args.owner}, ${categoryId}, ${args.amount}, ${currency}, ${note}, ${spentOn})
    returning id, amount::text as amount, currency, note, spent_on, category_id,
      null::text as category_name, null::text as category_emoji, null::text as category_color
  `;
  return r.rows[0];
}

export async function hentUtgifter(owner: string, limit = 50) {
  const r = await sql<Utgift>`
    select
      t.id,
      t.amount::text as amount,
      t.currency,
      t.note,
      t.spent_on,
      t.category_id,
      c.name as category_name,
      c.emoji as category_emoji,
      c.color as category_color
    from transactions t
    left join categories c on c.id = t.category_id
    where t.owner = ${owner}
    order by t.spent_on desc, t.id desc
    limit ${limit}
  `;
  return r.rows;
}

export async function slettUtgift(owner: string, id: number) {
  await sql`delete from transactions where owner = ${owner} and id = ${id}`;
}

export async function hentOppsummering(owner: string) {
  const today = new Date().toISOString().slice(0, 10);
  const first = new Date();
  first.setDate(1);
  const monthStart = first.toISOString().slice(0, 10);

  const [iDag, iManed, antallKategorier] = await Promise.all([
    sql<{ sum: string | null }>`
      select coalesce(sum(amount), 0)::text as sum
      from transactions
      where owner = ${owner} and spent_on = ${today}
    `,
    sql<{ sum: string | null }>`
      select coalesce(sum(amount), 0)::text as sum
      from transactions
      where owner = ${owner} and spent_on >= ${monthStart}
    `,
    sql<{ count: string }>`
      select count(*)::text as count
      from categories
      where owner = ${owner}
    `,
  ]);

  return {
    today: iDag.rows[0]?.sum ?? "0",
    month: iManed.rows[0]?.sum ?? "0",
    categories: antallKategorier.rows[0]?.count ?? "0",
    todayDate: today,
    monthStart,
  };
}
