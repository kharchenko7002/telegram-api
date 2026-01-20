import { NextResponse } from "next/server";
import { botSvar } from "app/lib/bot";

export const runtime = "nodejs";

type TgUpdate = {
  message?: {
    chat: { id: number };
    text?: string;
  };
};

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN mangler");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(req: Request) {
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await req.json()) as TgUpdate;

  const chatId = update.message?.chat?.id;
  const text = update.message?.text;

  if (chatId && text) {
    const svar = botSvar(text);
    await sendMessage(chatId, svar);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
