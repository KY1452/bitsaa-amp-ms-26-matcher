import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BITSAA MS Mentorship Program | Admin Console" },
      {
        name: "description",
        content:
          "Internal console for the BITSAA Alumni MS Mentorship Program: mentor and mentee records, mappings and reassignments.",
      },
      { property: "og:title", content: "BITSAA MS Mentorship Program | Admin Console" },
      {
        property: "og:description",
        content:
          "Internal console for the BITSAA Alumni MS Mentorship Program: mentor and mentee records and mappings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-cream text-ink font-sans grid place-items-center px-5 py-12">
      <main className="w-full max-w-2xl text-center">
        <span className="inline-flex w-14 h-14 rounded-2xl bg-coral border-2 border-ink shadow-hard items-center justify-center text-cream font-display font-black text-2xl">
          B
        </span>
        <h1 className="mt-6 font-display font-black text-5xl md:text-6xl leading-[0.95] tracking-tight">
          BITSAA MS Mentorship Program
        </h1>
        <p className="mt-4 text-ink/70 font-medium text-lg">
          The internal console for mentor and mentee records and their mappings. Access is limited
          to program administrators.
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-block font-bold text-sm px-6 py-3.5 rounded-full bg-sun text-ink border-2 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          Administrator sign in
        </Link>
      </main>
    </div>
  );
}
