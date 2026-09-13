import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Administrator sign in | BITSAA MS Mentorship" },
      {
        name: "description",
        content:
          "Secure sign in for BITSAA MS Mentorship Program administrators to manage mentors, mentees and mappings.",
      },
      { property: "og:title", content: "Administrator sign in | BITSAA MS Mentorship" },
      {
        property: "og:description",
        content: "Secure sign in for BITSAA MS Mentorship Program administrators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("kanishk.y@bitsaa.org");
  const [password, setPassword] = useState("kyad10");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) {
      console.error("Supabase sign in error:", signInError);
      setError("That email and password combination didn't work.");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen bg-cream text-ink font-sans grid place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-3 mb-6">
          <span className="w-11 h-11 rounded-2xl bg-coral grid place-items-center text-cream font-display font-black text-xl shadow-hard border-2 border-ink">
            B
          </span>
          <span className="leading-none text-left">
            <span className="block font-display font-black text-lg tracking-tight">
              BITSAA Mentorship
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">
              Admin console
            </span>
          </span>
        </Link>

        <div className="rounded-3xl bg-card border-2 border-ink p-6 shadow-hard-lg">
          <h1 className="font-display font-black text-3xl tracking-tight">Administrator sign in</h1>
          <p className="mt-2 text-sm text-ink/70 font-medium">
            Accounts are created by the program team. There is no public sign-up.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-ink/50">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-cream border-2 border-ink rounded-2xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-ink/50">
                Password
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-cream border-2 border-ink rounded-2xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </label>

            {error && <p className="text-sm font-bold text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full font-bold text-sm px-5 py-3 rounded-2xl bg-sun text-ink border-2 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
