import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TgUpdate = {
  message?: {
    chat: { id: number };
    text?: string;
  };
};

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(req: Request) {
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const update = (await req.json()) as TgUpdate;

  const chatId = update.message?.chat?.id;
  const text = update.message?.text;

  if (chatId && text) {
    if (text === "/start") {
      await sendMessage(chatId, "Hei! Jeg er BudsjettHjelper 🙂 Skriv noe!");
    } else if (text === "/id") {
      await sendMessage(chatId, `Din chatId: ${chatId}`);
    } else {
      await sendMessage(chatId, `Du skrev: ${text}`);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "Use POST from Telegram webhook" });
}
