"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { demoFamilyMembers, isDemoMode } from "@/lib/demo-data";

// 父子关系使用 father_uid 文本字段，无需反向匹配逻辑
async function updateOrphanedMembers(_supabase: any) {
  return;
}

// 仅保留年份格式，返回整数年份
function parseYear(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{4})/);
  if (!match) return null;

  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

export interface FamilyMember {
  id: number;
  uid: string | null;
  father_uid: string | null;
  generation: number | null;
  name: string;
  gender: "男" | "女" | null;
  sibling_order: number | null;
  father_name: string | null;
  official_position: string | null;
  is_alive: boolean;
  spouse: string | null;
  birth_date: number | null;
  death_date: number | null;
  residence_place: string | null;
  bio: string | null;
  updated_at: string;
}

export interface FetchMembersResult {
  data: FamilyMember[];
  count: number;
  error: string | null;
}

export async function fetchFamilyMembers(
  page: number = 1,
  pageSize: number = 50,
  searchQuery: string = ""
): Promise<FetchMembersResult> {
  // 演示模式：返回模拟数据
  if (isDemoMode()) {
    let filteredData = demoFamilyMembers;
    
    // 应用搜索过滤
    if (searchQuery.trim()) {
      filteredData = demoFamilyMembers.filter(member => 
        member.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
    }
    
    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedData = filteredData.slice(from, to);
    
    return { 
      data: paginatedData, 
      count: filteredData.length, 
      error: null 
    };
  }

  try {
    const supabase = await createClient();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("family_members")
      .select("*", { count: "exact" });

    if (searchQuery.trim()) {
      query = query.ilike("name", `%${searchQuery.trim()}%`);
    }

    const { data, count, error } = await query
      .order("generation", { ascending: true })
      .order("sibling_order", { ascending: true })
      .range(from, to);

    if (error) {
      return { data: [], count: 0, error: error.message };
    }

    // 获取所有父亲 UID
    const fatherUids = (data || [])
      .map((item: any) => item.father_uid)
      .filter((id: any): id is string => !!id);

    // 批量查询父亲姓名
    let fatherMap: Record<string, string> = {};
    if (fatherUids.length > 0) {
      const { data: fathers } = await supabase
        .from("family_members")
        .select("uid, name")
        .in("uid", fatherUids);

      if (fathers) {
        fatherMap = Object.fromEntries(fathers.map((f: any) => [f.uid, f.name]));
      }
    }

    // 转换数据格式，添加 father_name
    const transformedData: FamilyMember[] = (data || []).map((item: any) => ({
      ...item,
      father_name: item.father_uid ? fatherMap[item.father_uid] || null : null,
    }));

    return { data: transformedData, count: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching family members:', error);
    return { data: [], count: 0, error: 'Database connection failed' };
  }
}

export interface CreateMemberInput {
  name: string;
  generation?: number | null;
  sibling_order?: number | null;
  father_uid?: string | null;
  gender?: "男" | "女" | null;
  official_position?: string | null;
  is_alive?: boolean;
  spouse?: string | null;
  bio?: string | null;
  uid?: string | null;
  birth_date?: string | number | null;
  death_date?: string | number | null;
  residence_place?: string | null;
}

export async function createFamilyMember(
  input: CreateMemberInput
): Promise<{ success: boolean; error: string | null }> {
  // 演示模式：不允许数据修改
  if (isDemoMode()) {
    return { success: false, error: "当前为演示模式，请配置 Supabase 后再进行数据管理操作" };
  }

  try {
    const supabase = await createClient();

    // 检查用户是否已登录
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "请先登录后再进行数据管理操作" };
    }

    // 如果提供了 uid，检查是否已存在
    if (input.uid) {
      const { data: existingMember } = await supabase
        .from("family_members")
        .select("id")
        .eq("uid", input.uid)
        .single();

      if (existingMember) {
        return { success: false, error: `uid '${input.uid}' 已存在，请使用不同的 uid` };
      }
    }

    const { error } = await supabase.from("family_members").insert({
      name: input.name,
      uid: input.uid,
      father_uid: input.father_uid || null,
      generation: input.generation,
      gender: input.gender,
      sibling_order: input.sibling_order,
      official_position: input.official_position,
      is_alive: input.is_alive ?? true,
      spouse: input.spouse,
      bio: input.bio,
      birth_date: parseYear(input.birth_date),
      death_date: parseYear(input.death_date),
      residence_place: input.residence_place,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/family-tree", "layout");
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creating family member:', error);
    return { success: false, error: 'Database operation failed' };
  }
}

export async function deleteFamilyMembers(
  ids: number[]
): Promise<{ success: boolean; error: string | null }> {
  if (ids.length === 0) {
    return { success: false, error: "没有选择要删除的成员" };
  }

  // 演示模式：不允许数据修改
  if (isDemoMode()) {
    return { success: false, error: "当前为演示模式，请配置 Supabase 后再进行数据管理操作" };
  }

  try {
    const supabase = await createClient();

    // 检查用户是否已登录
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "请先登录后再进行数据管理操作" };
    }

    const { error } = await supabase
      .from("family_members")
      .delete()
      .in("id", ids);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/family-tree", "layout");
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting family members:', error);
    return { success: false, error: 'Database operation failed' };
  }
}

// 获取所有成员用于父亲选择下拉框
export async function fetchAllMembersForSelect(): Promise<
  { id: number; name: string; generation: number | null; uid: string | null }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, name, generation, uid")
    .order("generation", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching members for select:", error);
    return [];
  }

  return data || [];
}

// 获取所有成员的完整数据，用于自定义ID匹配
export async function fetchAllMembersForMatching(): Promise<FamilyMember[]> {
  // 演示模式：返回模拟数据
  if (isDemoMode()) {
    return demoFamilyMembers;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .order("generation", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching all members:", error);
    return [];
  }

  if (!data) return [];

  // 获取所有父亲UID
  const fatherUids = data.map((item: any) => item.father_uid).filter(Boolean);
  
  // 批量查询父亲信息（通过uid）
  const { data: fathers } = await supabase
    .from("family_members")
    .select("uid, name")
    .in("uid", fatherUids);

  const fatherMap: Record<string, string> = {};
  fathers?.forEach((father: any) => {
    if (father.uid) {
      fatherMap[father.uid] = father.name;
    }
  });

  // 转换数据格式，添加 father_name
  return data.map((item: any) => ({
    ...item,
    father_name: item.father_uid ? fatherMap[item.father_uid] || null : null,
  }));
}

export interface UpdateMemberInput extends CreateMemberInput {
  id: number;
}

// 根据 ID 获取单个成员
export async function fetchMemberByUid(
  uid: string
): Promise<FamilyMember | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("uid", uid)
    .single();

  if (error || !data) {
    console.error("Error fetching member by id:", error);
    return null;
  }

  // 如果有父亲UID，查询父亲姓名
  let father_name: string | null = null;
  if (data.father_uid) {
    const { data: father } = await supabase
      .from("family_members")
      .select("name")
      .eq("uid", data.father_uid)
      .single();
    father_name = father?.name || null;
  }

  return {
    ...data,
    father_name,
  } as FamilyMember;
}

export async function updateFamilyMember(
  input: UpdateMemberInput
): Promise<{ success: boolean; error: string | null }> {
  // 演示模式：不允许数据修改
  if (isDemoMode()) {
    return { success: false, error: "当前为演示模式，请配置 Supabase 后再进行数据管理操作" };
  }

  try {
    const supabase = await createClient();

    // 检查用户是否已登录
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "请先登录后再进行数据管理操作" };
    }

    const { error } = await supabase
    .from("family_members")
    .update({
      name: input.name,
      uid: input.uid,
      father_uid: input.father_uid || null,
      generation: input.generation,
      gender: input.gender,
      sibling_order: input.sibling_order,
      official_position: input.official_position,
      is_alive: input.is_alive ?? true,
      spouse: input.spouse,
      bio: input.bio,
      birth_date: parseYear(input.birth_date),
      death_date: parseYear(input.death_date),
      residence_place: input.residence_place,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/family-tree", "layout");
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating family member:', error);
    return { success: false, error: 'Database operation failed' };
  }
}

export interface ImportMemberInput {
  id?: string; // YAML中的唯一标识符
  name: string;
  generation?: number | null;
  sibling_order?: number | null;
  father_uid?: string | null; // 父亲的uid
  gender?: "男" | "女" | null;
  official_position?: string | null;
  is_alive?: boolean;
  spouse?: string | null;
  bio?: string | null; // 生平事迹内容
  birth_date?: string | number | null;
  death_date?: string | number | null;
  residence_place?: string | null;
}

export async function batchCreateFamilyMembers(
  members: ImportMemberInput[]
): Promise<{ success: boolean; count: number; error: string | null }> {
  // 演示模式：不允许数据修改
  if (isDemoMode()) {
    return { success: false, count: 0, error: "当前为演示模式，请配置 Supabase 后再进行数据管理操作" };
  }

  try {
    const supabase = await createClient();

    // 检查用户是否已登录
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, count: 0, error: "请先登录后再进行数据管理操作" };
    }

    // 第一步：提取所有待导入的 uid（过滤掉空值）
    const uidsToCheck = members
      .map((m) => m.id)
      .filter((uid): uid is string => !!uid);

    // 第二步：如果有 uid，查询数据库中已存在的 uid
    let existingUids: Set<string> = new Set();
    if (uidsToCheck.length > 0) {
      const { data: existingMembers } = await supabase
        .from("family_members")
        .select("uid")
        .in("uid", uidsToCheck);

      existingUids = new Set(existingMembers?.map((m) => m.uid) || []);
    }

    // 第三步：过滤掉已存在的 uid，只保留新数据
    const newMembers = members.filter((m) => {
      // 如果没有 uid，允许导入
      if (!m.id) return true;
      // 如果 uid 已存在，跳过
      return !existingUids.has(m.id);
    });

    // 第四步：如果没有新数据，返回成功（0条）
    if (newMembers.length === 0) {
      return {
        success: true,
        count: 0,
        error: `已跳过 ${members.length} 条记录（uid 已存在）`,
      };
    }

    const batchInsertPayload = newMembers.map((m: ImportMemberInput) => {
      let bio: string | null = null;

      if (m.bio && m.bio.trim()) {
        const bioContent = [
          {
            type: "paragraph",
            children: [{ text: m.bio.trim() }],
          },
        ];
        bio = JSON.stringify(bioContent);
      }

      return {
        uid: m.id || null,
        father_uid: m.father_uid || null,
        generation: m.generation,
        name: m.name,
        gender: m.gender,
        sibling_order: m.sibling_order,
        is_alive: m.is_alive ?? true,
        birth_date: parseYear(m.birth_date),
        death_date: parseYear(m.death_date),
        official_position: m.official_position,
        residence_place: m.residence_place,
        bio: bio,
        spouse: m.spouse,
      };
    });

    const { error } = await supabase
      .from("family_members")
      .insert(batchInsertPayload);

    if (error) {
      console.error("Error inserting batch members:", error);
      return { success: false, count: 0, error: `导入失败: ${error.message}` };
    }

    revalidatePath("/family-tree", "layout");
    return { success: true, count: newMembers.length, error: null };
  } catch (error: any) {
    console.error('Error batch creating family members:', error);
    return { success: false, count: 0, error: 'Database operation failed' };
  }
}

export async function fetchMembersForTimeline(): Promise<
  { id: number; name: string; birth_date: number | null; death_date: number | null; generation: number | null }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, name, birth_date, death_date, generation")
    .order("birth_date", { ascending: true });

  if (error) {
    console.error("Error fetching timeline data:", error);
    return [];
  }

  return data || [];
}
