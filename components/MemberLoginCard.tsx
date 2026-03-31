type LoginStep = "username" | "connect_telegram" | "enter_code";

import { useState } from "react";

export function MemberLoginCard({
  username,
  code,
  step,
  loading,
  statusMessage,
  error,
  deepLink,
  webLink,
  startCommand,
  botUsername,
  onUsernameChange,
  onCodeChange,
  onRequestCode,
  onVerifyCode,
}: {
  username: string;
  code: string;
  step: LoginStep;
  loading: boolean;
  statusMessage: string;
  error: string;
  deepLink: string;
  webLink: string;
  startCommand: string;
  botUsername: string;
  onUsernameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onRequestCode: () => Promise<void>;
  onVerifyCode: () => Promise<void>;
}) {
  const [copyMessage, setCopyMessage] = useState("");

  function legacyCopyText(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  }

  async function copyText(value: string) {
    if (!value) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setCopyMessage("Copied to clipboard.");
        return;
      }
    } catch {
      // fall through to legacy copy
    }

    const copied = legacyCopyText(value);
    setCopyMessage(copied ? "Copied to clipboard." : "Copy failed. Please select and copy manually.");
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[28px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
        Member login
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        Sign in with your Telegram code
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter the username your admin created for you. If your Telegram is already connected,
        we will send you a one-time login code there.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
            placeholder="yourname"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
          />
        </div>

        {step === "enter_code" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="login-code">
              Telegram login code
            </label>
            <input
              id="login-code"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
              inputMode="numeric"
              maxLength={6}
              placeholder="1234"
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
            />
          </div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-800">
            {statusMessage}
          </div>
        ) : null}

        {copyMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {copyMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        {step === "connect_telegram" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">Telegram connection required</p>
            <p className="mt-1">
              Choose the option that matches how you use Telegram. If Telegram Web does not start the bot automatically, use the manual start command.
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
                <p className="font-semibold text-slate-900">Option 1: Telegram app</p>
                <p className="mt-1 text-slate-700">
                  Open the Telegram app, go to the bot, and press <span className="font-semibold">Start</span>.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    className="inline-flex items-center rounded-full bg-amber-500 px-4 py-2 font-semibold text-white transition hover:bg-amber-600"
                    href={deepLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open in Telegram app
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
                <p className="font-semibold text-slate-900">Option 2: Telegram Web</p>
                <p className="mt-1 text-slate-700">
                  Open Telegram Web, sign in if needed, open the bot chat, and press <span className="font-semibold">Start</span>.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    className="inline-flex items-center rounded-full border border-amber-300 px-4 py-2 font-semibold text-amber-900 transition hover:bg-amber-100"
                    href={webLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open in Telegram Web
                  </a>
                  <input
                    className="min-w-[16rem] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                    readOnly
                    value={botUsername ? `@${botUsername}` : ""}
                  />
                  <button
                    className="rounded-full border border-amber-300 px-4 py-2 font-semibold text-amber-900 transition hover:bg-amber-100"
                    onClick={() => void copyText(botUsername ? `@${botUsername}` : "")}
                    type="button"
                  >
                    Copy bot username
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
                <p className="font-semibold text-slate-900">Option 3: Manual start command</p>
                <p className="mt-1 text-slate-700">
                  If browser links do not work, open the bot chat yourself and send this exact command.
                </p>
                <textarea
                  className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-xs text-white outline-none"
                  readOnly
                  value={startCommand}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-amber-300 px-4 py-2 font-semibold text-amber-900 transition hover:bg-amber-100"
                    onClick={() => void copyText(startCommand)}
                    type="button"
                  >
                    Copy start command
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-full border border-amber-300 px-4 py-2 font-semibold text-amber-900 transition hover:bg-amber-100"
                onClick={() => void onRequestCode()}
                type="button"
              >
                I connected Telegram, send code
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={() => void onRequestCode()}
            type="button"
          >
            {loading ? "Working..." : step === "enter_code" ? "Send new code" : "Continue"}
          </button>
          {step === "enter_code" ? (
            <button
              className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              onClick={() => void onVerifyCode()}
              type="button"
            >
              {loading ? "Verifying..." : "Log in"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
