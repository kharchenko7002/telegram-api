export function botSvar(tekst: string) {
  const t = tekst.trim().toLowerCase();

  if (t === "/start") return "Hei! Jeg er BudsjettHjelper. Skriv en melding 🙂";
  if (t === "/hjelp" || t === "/help") return "Kommandoer: /start, /hjelp, /id";
  if (t === "/id") return "Skriv /id i Telegram for å få chatId der.";
  if (t.includes("budsjett")) {
    return "Vil du føre budsjett etter dager eller kategorier? Svar: dager eller kategorier.";
  }
  if (t === "dager") {
    return "Flott. Skriv: dato og beløp, for eksempel: 2026-01-20 250";
  }
  if (t === "kategorier") {
    return "Flott. Skriv: kategori og beløp, for eksempel: mat 150";
  }

  return `Du skrev: ${tekst}`;
}
