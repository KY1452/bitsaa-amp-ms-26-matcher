import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  assignMentee,
  deleteMentor,
  fetchMentees,
  fetchMentors,
  saveMentee,
  saveMentor,
  type Mentee,
  type Mentor,
} from "@/lib/mentorship";
import {
  MenteeDialog,
  MenteeProfileDialog,
  MentorDialog,
  ReassignDialog,
  AssignToMentorDialog,
} from "@/components/mentorship/forms";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Mentor–Mentee Mappings | BITSAA MS Mentorship" },
      {
        name: "description",
        content:
          "Admin dashboard for BITSAA MS Mentorship: view every mentor, their mapped mentees, and reassign pairings.",
      },
      { property: "og:title", content: "Mentor–Mentee Mappings | BITSAA MS Mentorship" },
      {
        property: "og:description",
        content: "Admin dashboard for mentor and mentee records and their mappings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const adminQuery = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });

  const isAdmin = adminQuery.data === true;

  const mentorsQuery = useQuery({
    queryKey: ["mentors"],
    queryFn: fetchMentors,
    enabled: isAdmin,
  });
  const menteesQuery = useQuery({
    queryKey: ["mentees"],
    queryFn: fetchMentees,
    enabled: isAdmin,
  });

  const mentors = useMemo(() => mentorsQuery.data ?? [], [mentorsQuery.data]);
  const mentees = useMemo(() => menteesQuery.data ?? [], [menteesQuery.data]);

  const [search, setSearch] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [mentorDialog, setMentorDialog] = useState<{ open: boolean; mentor: Mentor | null }>({
    open: false,
    mentor: null,
  });
  const [menteeDialog, setMenteeDialog] = useState<{ open: boolean; mentee: Mentee | null }>({
    open: false,
    mentee: null,
  });
  const [assignToMentorDialog, setAssignToMentorDialog] = useState<{ open: boolean; mentor: Mentor | null }>({
    open: false,
    mentor: null,
  });
  const [reassigning, setReassigning] = useState<Mentee | null>(null);
  const [viewingMentee, setViewingMentee] = useState<Mentee | null>(null);

  function downloadCSV() {
    const headers = "Mentee Name,Mentor Name,Mentee Email,Mentor Email,Mentee Branch,Mentee Target Field,Mentor Target Field\n";
    const rows = mentees.map((m) => {
      const mentor = mentors.find((x) => x.id === m.mentor_id);
      
      const menteeName = `"${m.full_name || ""}"`;
      const mentorName = mentor ? `"${mentor.full_name}"` : "Unassigned";
      const menteeEmail = `"${m.email || ""}"`;
      const mentorEmail = mentor ? `"${mentor.email || ""}"` : "";
      const menteeBranch = `"${m.branch || ""}"`;
      const menteeTarget = `"${m.field_of_study || ""}"`;
      const mentorTarget = mentor ? `"${mentor.grad_field || mentor.expertise || ""}"` : "";

      return `${menteeName},${mentorName},${menteeEmail},${mentorEmail},${menteeBranch},${menteeTarget},${mentorTarget}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "mentor-mentee-mappings.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["mentors"] });
    queryClient.invalidateQueries({ queryKey: ["mentees"] });
  };

  const menteesByMentor = useMemo(() => {
    const map = new Map<string, Mentee[]>();
    for (const m of mentees) {
      const key = m.mentor_id ?? "__unassigned__";
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return map;
  }, [mentees]);

  const unassigned = menteesByMentor.get("__unassigned__") ?? [];

  const term = search.trim().toLowerCase();
  const visibleMentors = useMemo(() => {
    if (!term) return mentors;
    return mentors.filter((m) => {
      const own = [m.full_name, m.email, m.company, m.expertise, m.university]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const theirs = (menteesByMentor.get(m.id) ?? [])
        .map((x) => x.full_name)
        .join(" ")
        .toLowerCase();
      return own.includes(term) || theirs.includes(term);
    });
  }, [mentors, menteesByMentor, term]);

  const selectedMentor = mentors.find((m) => m.id === selectedMentorId) ?? mentors[0] ?? null;
  const selectedMentees = selectedMentor ? (menteesByMentor.get(selectedMentor.id) ?? []) : [];

  const assignMutation = useMutation({
    mutationFn: ({ menteeId, mentorId }: { menteeId: string; mentorId: string | null }) =>
      assignMentee(menteeId, mentorId),
    onSuccess: () => {
      toast.success("Mapping updated");
      refresh();
    },
    onError: () => toast.error("Could not update the mapping"),
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (adminQuery.isLoading) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center font-sans text-ink">
        <p className="font-bold">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center font-sans text-ink px-5">
        <div className="max-w-md text-center rounded-3xl bg-card border-2 border-ink p-7 shadow-hard-lg">
          <h1 className="font-display font-black text-3xl tracking-tight">No access</h1>
          <p className="mt-3 text-sm font-medium text-ink/70">
            This account is not on the administrator list for the mentorship program.
          </p>
          <button
            onClick={handleSignOut}
            className="mt-5 font-bold text-sm px-5 py-2.5 rounded-full bg-sun border-2 border-ink shadow-hard-sm active:translate-y-0.5"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-sans text-ink">
      <header className="sticky top-0 z-10 bg-cream/90 backdrop-blur border-b-2 border-ink">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-5 py-3.5">
          <div className="leading-none">
            <p className="font-display font-black text-lg tracking-tight">BITSAA Alumni mentorship program</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50 mt-1">
              MS Cohort 2026
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="ml-auto font-bold text-sm px-5 py-3 rounded-full bg-card border-2 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-5 py-7 space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-5xl md:text-6xl leading-[0.95] tracking-tight">
              Mentor–Mentee Mappings
            </h1>
            <p className="mt-2 text-ink/70 font-medium">
              Pair, reassign and manage every relationship across the cohort.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card border-2 border-ink rounded-full px-4 py-2.5 text-sm font-medium w-52 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-coral"
              placeholder="Search names…"
            />
            <button
              onClick={downloadCSV}
              className="font-bold text-sm px-5 py-3 rounded-full bg-teal text-cream border-2 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              ↓ Export CSV
            </button>
            <button
              onClick={() => setMentorDialog({ open: true, mentor: null })}
              className="font-bold text-sm px-5 py-3 rounded-full bg-sun border-2 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              + Add mentor
            </button>
            <button
              onClick={() => setMenteeDialog({ open: true, mentee: null })}
              className="font-bold text-sm px-5 py-3 rounded-full bg-card border-2 border-ink shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              + Add mentee
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat tone="coral" value={mentees.filter((m) => m.mentor_id).length} label="Active pairs" />
          <Stat tone="teal" value={mentors.length} label="Mentors" />
          <Stat tone="sun" value={mentees.length} label="Mentees" />
          <Stat tone="grape" value={unassigned.length} label="Awaiting match" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-2xl">Current pairs</h2>
              <span className="text-xs font-bold uppercase tracking-widest text-ink/50">
                {mentors.length} mentors
              </span>
            </div>

            {visibleMentors.length === 0 && (
              <div className="rounded-3xl bg-card border-2 border-ink p-6 shadow-hard">
                <p className="font-bold">No mentors yet.</p>
                <p className="text-sm text-ink/60 font-medium mt-1">
                  Add your first mentor to start building mappings.
                </p>
              </div>
            )}

            {visibleMentors.map((mentor) => {
              const list = menteesByMentor.get(mentor.id) ?? [];
              return (
                <div
                  key={mentor.id}
                  onClick={() => setSelectedMentorId(mentor.id)}
                  className="rounded-3xl bg-card border-2 border-ink p-4 shadow-hard cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-coral/15 grid place-items-center shrink-0 font-display font-black text-xl text-coral border-2 border-ink">
                      {initials(mentor.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-lg leading-tight truncate">{mentor.full_name}</p>
                      <p className="text-sm text-ink/60 font-medium truncate">
                        {[mentor.job_title, mentor.company].filter(Boolean).join(" · ") ||
                          "Alumni mentor"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {mentor.expertise && (
                          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-teal/15 text-teal border border-teal/30">
                            {mentor.expertise}
                          </span>
                        )}
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-sun/20 text-ink border border-sun/40">
                          {list.length} of {mentor.capacity} mentees
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMentorDialog({ open: true, mentor });
                      }}
                      className="shrink-0 text-xs font-bold px-4 py-2.5 rounded-full bg-ink text-cream active:translate-y-0.5"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="my-3 h-px bg-ink/10" />

                  {list.length === 0 ? (
                    <p className="text-sm font-medium text-ink/50">No mentees mapped yet.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {list.map((mentee) => (
                        <div key={mentee.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-teal/15 grid place-items-center shrink-0 font-bold text-teal border-2 border-ink">
                            {initials(mentee.full_name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold truncate">{mentee.full_name}</p>
                            <p className="text-xs text-ink/60 font-medium truncate">
                              {[mentee.branch, mentee.grad_year ? `'${String(mentee.grad_year).slice(-2)}` : null]
                                .filter(Boolean)
                                .join(" · ") || "Mentee"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReassigning(mentee);
                              }}
                              className="text-xs font-bold px-3 py-2 rounded-full bg-coral text-cream border-2 border-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                            >
                              Reassign
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingMentee(mentee);
                              }}
                              className="text-xs font-bold px-3 py-2 rounded-full bg-card border-2 border-ink active:translate-y-0.5"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-3xl bg-grape/10 border-2 border-ink p-4 shadow-hard">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display font-bold text-xl">Awaiting match</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-ink/50">
                  {unassigned.length} mentees
                </span>
              </div>
              {unassigned.length === 0 ? (
                <p className="mt-2 text-sm font-medium text-ink/60">Everyone has a mentor.</p>
              ) : (
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  {unassigned.map((mentee) => (
                    <div key={mentee.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-grape/20 grid place-items-center shrink-0 font-bold text-grape border-2 border-ink">
                        {initials(mentee.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{mentee.full_name}</p>
                        <p className="text-xs text-ink/60 font-medium truncate">
                          {[mentee.branch, mentee.grad_year ? `'${String(mentee.grad_year).slice(-2)}` : null]
                            .filter(Boolean)
                            .join(" · ") || "Mentee"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setReassigning(mentee)}
                          className="text-xs font-bold px-3 py-2 rounded-full bg-coral text-cream border-2 border-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => setViewingMentee(mentee)}
                          className="text-xs font-bold px-3 py-2 rounded-full bg-card border-2 border-ink active:translate-y-0.5"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-1 rounded-3xl bg-card border-2 border-ink p-5 shadow-hard-lg sticky top-[88px] max-h-[calc(100vh-100px)] overflow-y-auto">
            {selectedMentor ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-coral/15 grid place-items-center shrink-0 font-display font-black text-2xl text-coral border-2 border-ink">
                    {initials(selectedMentor.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-black text-2xl leading-none">
                      {selectedMentor.full_name}
                    </p>
                    <p className="text-sm text-ink/60 font-medium mt-1">
                      {selectedMentor.job_title ?? "Alumni mentor"}
                    </p>
                    {selectedMentor.expertise && (
                      <span className="inline-block mt-2 text-[11px] font-bold px-3 py-1 rounded-full bg-teal/15 text-teal border border-teal/30">
                        {selectedMentor.expertise}
                      </span>
                    )}
                  </div>
                </div>

                <dl className="mt-5 space-y-3 text-sm">
                  <Row label="Mentees" value={`${selectedMentees.length} of ${selectedMentor.capacity}`} />
                  <Row label="Graduate field" value={selectedMentor.grad_field ?? "—"} />
                  <Row label="BITS degree" value={selectedMentor.bits_degree ?? selectedMentor.branch ?? "—"} />
                  <Row label="Graduated" value={selectedMentor.grad_year?.toString() ?? "—"} />
                  <Row label="Company" value={selectedMentor.company ?? "—"} />
                  <Row
                    label="Experience"
                    value={
                      selectedMentor.years_experience != null
                        ? `${selectedMentor.years_experience} yrs`
                        : "—"
                    }
                  />
                  <Row label="Mentorship" value={selectedMentor.mentorship_type ?? "—"} />
                  <Row
                    label="Hours / month"
                    value={
                      selectedMentor.hours_long_term != null
                        ? `${selectedMentor.hours_long_term}`
                        : "—"
                    }
                  />
                  <Row label="Country" value={selectedMentor.country ?? "—"} />
                  <Row label="Email" value={selectedMentor.email ?? "—"} />
                  <Row label="Phone" value={selectedMentor.phone ?? "—"} />
                </dl>

                {selectedMentor.linkedin && (
                  <a
                    href={selectedMentor.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-bold underline text-grape break-all"
                  >
                    LinkedIn profile
                  </a>
                )}

                {selectedMentor.notes && (
                  <p className="mt-4 text-sm font-medium text-ink/70">{selectedMentor.notes}</p>
                )}


                <div className={`mt-5 grid ${selectedMentees.length < (selectedMentor.capacity ?? 0) ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  {selectedMentees.length < (selectedMentor.capacity ?? 0) && (
                    <button
                      onClick={() => setAssignToMentorDialog({ open: true, mentor: selectedMentor })}
                      className="font-bold text-[11px] px-3 py-3 rounded-2xl bg-teal text-cream border-2 border-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      + Assign Mentee
                    </button>
                  )}
                  <button
                    onClick={() => setMentorDialog({ open: true, mentor: selectedMentor })}
                    className="font-bold text-[11px] px-3 py-3 rounded-2xl bg-sun border-2 border-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    Edit profile
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove ${selectedMentor.full_name}? Their mentees become unassigned.`))
                        return;
                      await deleteMentor(selectedMentor.id);
                      setSelectedMentorId(null);
                      toast.success("Mentor removed");
                      refresh();
                    }}
                    className="font-bold text-sm px-4 py-3 rounded-2xl bg-coral text-cream border-2 border-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <p className="font-medium text-ink/60 text-sm">
                Select a mentor to see their full profile here.
              </p>
            )}
          </aside>
        </div>
      </main>

      <MentorDialog
        open={mentorDialog.open}
        mentor={mentorDialog.mentor}
        onOpenChange={(open) => setMentorDialog((p) => ({ ...p, open }))}
        onSave={async (values, id) => {
          await saveMentor(values, id);
          toast.success(id ? "Mentor updated" : "Mentor added");
          refresh();
        }}
      />

      <MenteeDialog
        open={menteeDialog.open}
        mentee={menteeDialog.mentee}
        mentors={mentors}
        onOpenChange={(open) => setMenteeDialog((p) => ({ ...p, open }))}
        onSave={async (values, id) => {
          await saveMentee(values, id);
          toast.success(id ? "Mentee updated" : "Mentee added");
          refresh();
        }}
      />

      <ReassignDialog
        mentee={reassigning}
        mentors={mentors.filter(m => (menteesByMentor.get(m.id)?.length ?? 0) < (m.capacity ?? 4) || m.id === reassigning?.mentor_id)}
        onOpenChange={(open) => {
          if (!open) setReassigning(null);
        }}
        onAssign={async (menteeId, mentorId) => {
          await assignMutation.mutateAsync({ menteeId, mentorId });
        }}
      />

      <MenteeProfileDialog
        mentee={viewingMentee}
        mentorName={
          mentors.find((m) => m.id === viewingMentee?.mentor_id)?.full_name ?? null
        }
        onOpenChange={(open) => {
          if (!open) setViewingMentee(null);
        }}
        onEdit={() => {
          const mentee = viewingMentee;
          setViewingMentee(null);
          setMenteeDialog({ open: true, mentee });
        }}
      />

      <AssignToMentorDialog
        open={assignToMentorDialog.open}
        mentor={assignToMentorDialog.mentor}
        mentees={mentees}
        onOpenChange={(open) => {
          if (!open) setAssignToMentorDialog({ open: false, mentor: null });
        }}
        onAssign={async (menteeId, mentorId) => {
          await assignMutation.mutateAsync({ menteeId, mentorId });
        }}
      />
    </div>
  );
}

function Stat({
  tone,
  value,
  label,
}: {
  tone: "coral" | "teal" | "sun" | "grape";
  value: number;
  label: string;
}) {
  const tones: Record<string, string> = {
    coral: "bg-coral text-cream",
    teal: "bg-teal text-cream",
    sun: "bg-sun text-ink",
    grape: "bg-grape text-cream",
  };
  return (
    <div className={`rounded-3xl border-2 border-ink p-5 shadow-hard ${tones[tone]}`}>
      <p className="font-display font-black text-4xl">{value}</p>
      <p className="text-xs font-bold uppercase tracking-[0.15em] mt-1">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b-2 border-dashed border-ink/10 pb-2">
      <dt className="text-ink/50 font-medium shrink-0">{label}</dt>
      <dd className="font-bold truncate text-right">{value}</dd>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
