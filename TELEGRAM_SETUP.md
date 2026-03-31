# Telegram Bot Setup

## Environment Variables

Create a `.env.local` file and set:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username_here
```

## Create The Bot

1. Open Telegram and message `@BotFather`
2. Run `/newbot`
3. Choose a bot name and username
4. Copy the bot token
5. Put the token and username into `.env.local`

## How It Works

- The web app and Telegram bot now run as two separate processes in the same repo.
- `npm run dev` starts the Next.js web app.
- `npm run bot` starts the Telegram bot with `telegraf` long polling.
- You do not need to configure `ngrok`, `cloudflared`, or a Telegram webhook for local development.
- The existing webhook route remains available as an optional fallback, but polling mode does not need it.

## Local Development Notes

- Run the web app in one terminal:

```bash
npm run dev
```

- Run the Telegram bot in a second terminal:

```bash
npm run bot
```

- As long as `.env.local` contains `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME`, the bot process will start polling.
- Keep the bot terminal open while testing Telegram locally because that process receives Telegram updates.
- The web app stays a single Next.js frontend/backend codebase, and the bot is a separate Node worker in the same repo.

## Production Notes

- This polling approach works when both the web app and bot run as persistent Node.js processes.
- It is a good fit for a VPS or single long-running server process.
- It is not a good fit for serverless deployments that spin down between requests.
- In production, run both:

```bash
npm start
npm run bot
```

## Test The Connect Flow

1. Start the web app and bot
2. Open the main app or `/member`
3. Pick your identity if needed, then click `Connect Telegram`
4. A Telegram deep link opens:
   `https://t.me/<BOT_USERNAME>?start=<TOKEN>`
5. Press `Start` in Telegram
6. The bot should reply:
   `Your Telegram is now connected to Traideas Content Pipeline.`
7. Return to the app and press `Refresh`

## Test Reminder Route Manually

Run:

```bash
curl -X POST http://127.0.0.1:3000/api/cron/telegram-reminders
```

This route checks:

- pending title reminders
- content due today reminders
- weekly operator summary reminders

## Test A Member Notification Manually

Run:

```bash
curl -X POST http://127.0.0.1:3000/api/telegram/test \
  -H "Content-Type: application/json" \
  -d '{"member_id":"YOUR_MEMBER_ID"}'
```

## Optional Check

When the bot boots successfully, the bot terminal should include:

```bash
[telegram-bot] Long polling started.
```
