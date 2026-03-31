export function AdminLoginCard({
  username,
  password,
  loading,
  error,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: {
  username: string;
  password: string;
  loading: boolean;
  error: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
        Admin login
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        Member management
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Sign in with the admin credentials from your environment file to manage members.
      </p>

      <div className="mt-6 space-y-4">
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
          placeholder="Admin username"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
          placeholder="Admin password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
        />

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          onClick={() => void onSubmit()}
          type="button"
        >
          {loading ? "Signing in..." : "Sign in as admin"}
        </button>
      </div>
    </div>
  );
}
