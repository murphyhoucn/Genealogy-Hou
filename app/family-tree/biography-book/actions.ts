"use server";

import { createClient } from "@/lib/supabase/server";

export interface BiographyMember {
    id: number;
    name: string;
    generation: number | null;
    sibling_order: number | null;
    gender: "男" | "女" | null;
    birth_date: number | null;
    death_date: number | null;
    is_alive: boolean;
    spouse: string | null;
    official_position: string | null;
    residence_place: string | null;
    bio: string;
    father_uid: string | null;
    father_name: string | null;
}

/**
 * 获取所有有生平事迹的成员，用于生平册展示
 */
export async function fetchMembersWithBiography(): Promise<{
    data: BiographyMember[];
    error: string | null;
}> {
    const supabase = await createClient();

    // 查询有 bio 的成员
    const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .not("bio", "is", null)
        .neq("bio", "")
        .order("generation", { ascending: true })
        .order("sibling_order", { ascending: true });

    if (error) {
        return { data: [], error: error.message };
    }

    // 过滤掉 bio 只是空的 JSON 结构或无实质内容的情况
    const validData = (data || []).filter((item: any) => {
        if (!item.bio) return false;
        
        const remarksText = item.bio.trim();
        
        // 检查是否包含BIO:格式的内容
        if (remarksText.includes('BIO:')) {
            return true;
        }
        
        try {
            const parsed = JSON.parse(remarksText);
            // 检查是否有实质内容
            if (Array.isArray(parsed)) {
                return parsed.some((node: any) => {
                    if (node.children && Array.isArray(node.children)) {
                        return node.children.some((child: any) => child.text && child.text.trim());
                    }
                    return node.text && node.text.trim();
                });
            }
            return false;
        } catch {
            // 如果不是 JSON，检查是否为非空字符串且不只是ID信息
            const lines = remarksText.split('\n');
            return lines.some(line => 
                !line.startsWith('ID:') && 
                !line.startsWith('FATHER_ID:') && 
                line.trim().length > 0
            );
        }
    });

    // 获取所有父亲 UID
    const fatherUids = validData
        .map((item) => item.father_uid)
        .filter((id): id is string => !!id);

    // 批量查询父亲姓名
    let fatherMap: Record<string, string> = {};
    if (fatherUids.length > 0) {
        const { data: fathers } = await supabase
            .from("family_members")
            .select("uid, name")
            .in("uid", fatherUids);

        if (fathers) {
            fatherMap = Object.fromEntries(fathers.map((f) => [f.uid, f.name]));
        }
    }

    // 转换数据格式
    const transformedData: BiographyMember[] = validData.map((item) => ({
        id: item.id,
        name: item.name,
        generation: item.generation,
        sibling_order: item.sibling_order,
        gender: item.gender,
        birth_date: item.birth_date,
        death_date: item.death_date,
        is_alive: item.is_alive,
        spouse: item.spouse,
        official_position: item.official_position,
        residence_place: item.residence_place,
        bio: item.bio,
        father_uid: item.father_uid,
        father_name: item.father_uid ? fatherMap[item.father_uid] || null : null,
    }));

    return { data: transformedData, error: null };
}
