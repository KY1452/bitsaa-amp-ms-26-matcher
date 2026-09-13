import { supabase } from "@/integrations/supabase/client";

export type Mentor = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  grad_year: number | null;
  branch: string | null;
  job_title: string | null;
  company: string | null;
  university: string | null;
  country: string | null;
  expertise: string | null;
  capacity: number;
  status: string;
  notes: string | null;
  linkedin: string | null;
  bits_id: string | null;
  bits_degree: string | null;
  city: string | null;
  state: string | null;
  grad_field: string | null;
  employment_status: string | null;
  years_experience: number | null;
  mentorship_type: string | null;
  hours_long_term: number | null;
  hours_reviews: number | null;
  previous_employers: string | null;
};

export type Mentee = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  grad_year: number | null;
  branch: string | null;
  cgpa: number | null;
  target_intake: string | null;
  target_countries: string | null;
  target_universities: string | null;
  field_of_study: string | null;
  status: string;
  notes: string | null;
  mentor_id: string | null;
  linkedin: string | null;
  bits_id: string | null;
  bits_degree: string | null;
  city: string | null;
  state: string | null;
  company: string | null;
  job_title: string | null;
  employment_status: string | null;
  years_experience: number | null;
  guidance_needed: string | null;
  commitment_hours: number | null;
  test_scores: string | null;
  background: string | null;
  goals: string | null;
  expectations: string | null;
  unmatched_reason: string | null;
};


export async function fetchMentors(): Promise<Mentor[]> {
  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Mentor[];
}

export async function fetchMentees(): Promise<Mentee[]> {
  const { data, error } = await supabase
    .from("mentees")
    .select("*")
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Mentee[];
}

export async function saveMentor(values: Partial<Mentor> & { full_name: string }, id?: string) {
  if (id) {
    const { error } = await supabase.from("mentors").update(values).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("mentors").insert(values);
    if (error) throw error;
  }
}

export async function saveMentee(values: Partial<Mentee> & { full_name: string }, id?: string) {
  if (id) {
    const { error } = await supabase.from("mentees").update(values).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("mentees").insert(values);
    if (error) throw error;
  }
}

export async function assignMentee(menteeId: string, mentorId: string | null) {
  const { error } = await supabase
    .from("mentees")
    .update({ mentor_id: mentorId })
    .eq("id", menteeId);
  if (error) throw error;
}

export async function deleteMentor(id: string) {
  const { error } = await supabase.from("mentors").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteMentee(id: string) {
  const { error } = await supabase.from("mentees").delete().eq("id", id);
  if (error) throw error;
}
