"use server";

import { createClient } from "@/lib/supabase/server";

export interface FamilyMemberNode {
  id: number;
  uid: string | null;
  father_uid: string | null;
  father_id: number | null;
  generation: number | null;
  name: string;
  gender: "男" | "女" | null;
  sibling_order: number | null;
  official_position: string | null;
  is_alive: boolean;
  spouse: string | null;
  bio: string | null;
  birth_date: number | null;
  death_date: number | null;
  residence_place: string | null;
}

export interface FetchGraphResult {
  data: FamilyMemberNode[];
  error: string | null;
}

export async function fetchAllFamilyMembers(): Promise<FetchGraphResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, uid, father_uid, generation, name, gender, sibling_order, is_alive, birth_date, death_date, official_position, residence_place, bio, spouse")
    .order("generation", { ascending: true })
    .order("sibling_order", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  const rows = data || [];
  const uidToId = new Map<string, number>();
  rows.forEach((row: any) => {
    if (row.uid) {
      uidToId.set(row.uid, row.id);
    }
  });

  const normalized = rows.map((row: any) => ({
    ...row,
    father_id: row.father_uid ? uidToId.get(row.father_uid) ?? null : null,
  }));

  return { data: normalized, error: null };
}
