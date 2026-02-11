import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  // 检查是否为演示模式
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'your_supabase_url_here' || 
      supabaseKey === 'your_supabase_anon_key_here') {
    // 返回一个模拟的客户端对象，避免抛出错误
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getClaims: async () => ({ data: { claims: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({ data: [], error: new Error('Demo mode: No database access') }),
          in: () => ({ data: [], error: new Error('Demo mode: No database access') }),
          ilike: () => ({ data: [], error: new Error('Demo mode: No database access') }),
          order: () => ({ data: [], error: new Error('Demo mode: No database access') }),
          range: () => ({ data: [], error: new Error('Demo mode: No database access') }),
          single: () => ({ data: null, error: new Error('Demo mode: No database access') }),
        }),
        insert: () => ({ error: new Error('Demo mode: No database access') }),
        update: () => ({ error: new Error('Demo mode: No database access') }),
        delete: () => ({ error: new Error('Demo mode: No database access') }),
      }),
    } as any;
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
