import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  // 检查是否为演示模式
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'your_supabase_url_here' || 
      supabaseKey === 'your_supabase_anon_key_here') {
    // 返回一个模拟的客户端对象
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ error: new Error('Demo mode: Please configure Supabase first') }),
        signUp: async () => ({ error: new Error('Demo mode: Please configure Supabase first') }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ error: new Error('Demo mode: Please configure Supabase first') }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } }
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({ data: [], error: new Error('Demo mode: No database access') }),
          in: () => ({ data: [], error: new Error('Demo mode: No database access') }),
        }),
      }),
    } as any;
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
}
