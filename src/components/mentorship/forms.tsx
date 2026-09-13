import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Mentee, Mentor } from "@/lib/mentorship";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink/50">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-cream border-2 border-ink rounded-2xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral"
      />
    </label>
  );
}

export function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink/50">{label}</span>
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-cream border-2 border-ink rounded-2xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral"
      />
    </label>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="font-bold text-sm px-5 py-2.5 rounded-full bg-sun text-ink border-2 border-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-bold text-sm px-4 py-2.5 rounded-full bg-card border-2 border-ink active:translate-y-0.5"
    >
      {children}
    </button>
  );
}

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const nullable = (v: string) => (v.trim() === "" ? null : v.trim());
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

export function MentorDialog({
  open,
  onOpenChange,
  mentor,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mentor: Mentor | null;
  onSave: (values: Partial<Mentor> & { full_name: string }, id?: string) => Promise<void>;
}) {
  const [f, setF] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF({
      full_name: str(mentor?.full_name),
      email: str(mentor?.email),
      phone: str(mentor?.phone),
      grad_year: str(mentor?.grad_year),
      branch: str(mentor?.branch),
      job_title: str(mentor?.job_title),
      company: str(mentor?.company),
      university: str(mentor?.university),
      country: str(mentor?.country),
      expertise: str(mentor?.expertise),
      capacity: str(mentor?.capacity ?? 5),
      notes: str(mentor?.notes),
    });
  }, [open, mentor]);

  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f['full_name']?.trim()) return;
    setBusy(true);
    try {
      await onSave(
        {
          full_name: f['full_name'].trim(),
          email: nullable(f['email'] ?? ""),
          phone: nullable(f['phone'] ?? ""),
          grad_year: numOrNull(f['grad_year'] ?? ""),
          branch: nullable(f['branch'] ?? ""),
          job_title: nullable(f['job_title'] ?? ""),
          company: nullable(f['company'] ?? ""),
          university: nullable(f['university'] ?? ""),
          country: nullable(f['country'] ?? ""),
          expertise: nullable(f['expertise'] ?? ""),
          capacity: Number(f['capacity'] || 5),
          notes: nullable(f['notes'] ?? ""),
        },
        mentor?.id,
      );
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-2 border-ink rounded-3xl shadow-hard-lg max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-2xl tracking-tight">
            {mentor ? "Edit mentor" : "Add mentor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <Field label="Full name" value={f['full_name'] ?? ""} onChange={set("full_name")} />
          <Field label="Email" value={f['email'] ?? ""} onChange={set("email")} type="email" />
          <Field label="Phone" value={f['phone'] ?? ""} onChange={set("phone")} />
          <Field label="Graduation year" value={f['grad_year'] ?? ""} onChange={set("grad_year")} />
          <Field label="Branch" value={f['branch'] ?? ""} onChange={set("branch")} />
          <Field label="Current role" value={f['job_title'] ?? ""} onChange={set("job_title")} />
          <Field label="Company" value={f['company'] ?? ""} onChange={set("company")} />
          <Field label="MS university" value={f['university'] ?? ""} onChange={set("university")} />
          <Field label="Country" value={f['country'] ?? ""} onChange={set("country")} />
          <Field label="Expertise" value={f['expertise'] ?? ""} onChange={set("expertise")} />
          <Field label="Mentee capacity" value={f['capacity'] ?? ""} onChange={set("capacity")} />
          <div className="sm:col-span-2">
            <TextareaField label="Notes" value={f['notes'] ?? ""} onChange={set("notes")} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <GhostButton onClick={() => onOpenChange(false)}>Cancel</GhostButton>
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save mentor"}
            </PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MenteeDialog({
  open,
  onOpenChange,
  mentee,
  mentors,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mentee: Mentee | null;
  mentors: Mentor[];
  onSave: (values: Partial<Mentee> & { full_name: string }, id?: string) => Promise<void>;
}) {
  const [f, setF] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF({
      full_name: str(mentee?.full_name),
      email: str(mentee?.email),
      phone: str(mentee?.phone),
      grad_year: str(mentee?.grad_year),
      branch: str(mentee?.branch),
      cgpa: str(mentee?.cgpa),
      target_intake: str(mentee?.target_intake),
      target_countries: str(mentee?.target_countries),
      target_universities: str(mentee?.target_universities),
      field_of_study: str(mentee?.field_of_study),
      notes: str(mentee?.notes),
      mentor_id: str(mentee?.mentor_id),
    });
  }, [open, mentee]);

  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f['full_name']?.trim()) return;
    setBusy(true);
    try {
      await onSave(
        {
          full_name: f['full_name'].trim(),
          email: nullable(f['email'] ?? ""),
          phone: nullable(f['phone'] ?? ""),
          grad_year: numOrNull(f['grad_year'] ?? ""),
          branch: nullable(f['branch'] ?? ""),
          cgpa: numOrNull(f['cgpa'] ?? ""),
          target_intake: nullable(f['target_intake'] ?? ""),
          target_countries: nullable(f['target_countries'] ?? ""),
          target_universities: nullable(f['target_universities'] ?? ""),
          field_of_study: nullable(f['field_of_study'] ?? ""),
          notes: nullable(f['notes'] ?? ""),
          mentor_id: nullable(f['mentor_id'] ?? ""),
        },
        mentee?.id,
      );
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-2 border-ink rounded-3xl shadow-hard-lg max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-2xl tracking-tight">
            {mentee ? "Edit mentee" : "Add mentee"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <Field label="Full name" value={f['full_name'] ?? ""} onChange={set("full_name")} />
          <Field label="Email" value={f['email'] ?? ""} onChange={set("email")} type="email" />
          <Field label="Phone" value={f['phone'] ?? ""} onChange={set("phone")} />
          <Field label="Graduation year" value={f['grad_year'] ?? ""} onChange={set("grad_year")} />
          <Field label="Branch" value={f['branch'] ?? ""} onChange={set("branch")} />
          <Field label="CGPA" value={f['cgpa'] ?? ""} onChange={set("cgpa")} />
          <Field
            label="Target intake"
            value={f['target_intake'] ?? ""}
            onChange={set("target_intake")}
            placeholder="Fall 2026"
          />
          <Field
            label="Field of study"
            value={f['field_of_study'] ?? ""}
            onChange={set("field_of_study")}
          />
          <Field
            label="Target countries"
            value={f['target_countries'] ?? ""}
            onChange={set("target_countries")}
          />
          <Field
            label="Target universities"
            value={f['target_universities'] ?? ""}
            onChange={set("target_universities")}
          />
          <label className="block sm:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink/50">
              Mapped mentor
            </span>
            <select
              value={f['mentor_id'] ?? ""}
              onChange={(e) => set("mentor_id")(e.target.value)}
              className="mt-1 w-full bg-cream border-2 border-ink rounded-2xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral"
            >
              <option value="">Unassigned</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <TextareaField label="Notes" value={f['notes'] ?? ""} onChange={set("notes")} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <GhostButton onClick={() => onOpenChange(false)}>Cancel</GhostButton>
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save mentee"}
            </PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReassignDialog({
  mentee,
  mentors,
  onOpenChange,
  onAssign,
}: {
  mentee: Mentee | null;
  mentors: Mentor[];
  onOpenChange: (o: boolean) => void;
  onAssign: (menteeId: string, mentorId: string | null) => Promise<void>;
}) {
  const [choice, setChoice] = useState<string>("");

  useEffect(() => {
    setChoice(mentee?.mentor_id ?? "");
  }, [mentee]);

  return (
    <Dialog open={!!mentee} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-2 border-ink rounded-3xl shadow-hard-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-2xl tracking-tight">
            Reassign {mentee?.full_name}
          </DialogTitle>
        </DialogHeader>
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className="w-full bg-cream border-2 border-ink rounded-2xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral"
        >
          <option value="">Unassigned</option>
          {mentors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name} {m.grad_field || m.expertise ? `(${m.grad_field || m.expertise})` : ""}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={() => onOpenChange(false)}>Cancel</GhostButton>
          <PrimaryButton
            onClick={async () => {
              if (!mentee) return;
              await onAssign(mentee.id, choice === "" ? null : choice);
              onOpenChange(false);
            }}
          >
            Save mapping
          </PrimaryButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="border-b-2 border-dashed border-ink/10 pb-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink/50">{label}</p>
      <p className="text-sm font-medium mt-0.5 whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

export function MenteeProfileDialog({
  mentee,
  mentorName,
  onOpenChange,
  onEdit,
}: {
  mentee: Mentee | null;
  mentorName: string | null;
  onOpenChange: (o: boolean) => void;
  onEdit: () => void;
}) {
  if (!mentee) return null;
  return (
    <Dialog open={!!mentee} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-2 border-ink rounded-3xl shadow-hard-lg max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-2xl tracking-tight">
            {mentee.full_name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          <Detail label="Mapped mentor" value={mentorName ?? "Not mapped yet"} />
          <Detail label="Status" value={mentee.status} />
          <Detail label="Email" value={mentee.email} />
          <Detail label="Phone" value={mentee.phone} />
          <Detail label="BITS ID" value={mentee.bits_id} />
          <Detail label="BITS degree" value={mentee.bits_degree ?? mentee.branch} />
          <Detail label="Graduation year" value={mentee.grad_year ? String(mentee.grad_year) : null} />
          <Detail label="Location" value={[mentee.state, mentee.city].filter(Boolean).join(", ") || null} />
          <Detail label="Employment" value={[mentee.job_title, mentee.company].filter(Boolean).join(" · ") || mentee.employment_status} />
          <Detail label="Work experience" value={mentee.years_experience != null ? `${mentee.years_experience} yrs` : null} />
          <Detail label="Monthly time commitment" value={mentee.commitment_hours != null ? `${mentee.commitment_hours} hrs` : null} />
          <Detail label="Test scores" value={mentee.test_scores} />
          <div className="sm:col-span-2 grid gap-3">
            <Detail label="Target field" value={mentee.field_of_study} />
            <Detail label="Target countries" value={mentee.target_countries} />
            <Detail label="University list" value={mentee.target_universities} />
            <Detail label="Help needed" value={mentee.guidance_needed} />
            <Detail label="Background" value={mentee.background} />
            <Detail label="Goals for the degree" value={mentee.goals} />
            <Detail label="Expectations from mentorship" value={mentee.expectations} />
            <Detail label="Why not matched" value={mentee.unmatched_reason} />
            <Detail label="Notes" value={mentee.notes} />
            {mentee.linkedin && (
              <a
                href={mentee.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold underline text-grape break-all"
              >
                LinkedIn profile
              </a>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <GhostButton onClick={() => onOpenChange(false)}>Close</GhostButton>
          <PrimaryButton onClick={onEdit}>Edit mentee</PrimaryButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AssignToMentorDialog({
  open,
  mentor,
  mentees,
  onOpenChange,
  onAssign,
}: {
  open: boolean;
  mentor: Mentor | null;
  mentees: Mentee[];
  onOpenChange: (o: boolean) => void;
  onAssign: (menteeId: string, mentorId: string) => Promise<void>;
}) {
  const [choice, setChoice] = useState<string>("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-2 border-ink rounded-3xl shadow-hard-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-2xl tracking-tight">
            Assign Mentee to {mentor?.full_name}
          </DialogTitle>
        </DialogHeader>
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className="w-full bg-cream border-2 border-ink rounded-2xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral"
        >
          <option value="" disabled>Select a mentee...</option>
          {mentees.filter(m => !m.mentor_id).map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name} {m.field_of_study ? `(${m.field_of_study})` : ""}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2 mt-2">
          <GhostButton onClick={() => { setChoice(""); onOpenChange(false); }}>Cancel</GhostButton>
          <PrimaryButton
            onClick={async () => {
              if (!mentor || !choice) return;
              const selectedMentee = mentees.find(m => m.id === choice);
              if (selectedMentee?.mentor_id && selectedMentee.mentor_id !== mentor.id) {
                alert("Error: This mentee is already assigned to another mentor!");
                return;
              }
              await onAssign(choice, mentor.id);
              setChoice("");
              onOpenChange(false);
            }}
          >
            Assign
          </PrimaryButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
