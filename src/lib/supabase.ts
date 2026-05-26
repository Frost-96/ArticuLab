// src/lib/supabase.ts
// Supabase 服务端客户端（延迟初始化，使用 service_role key 绕过 RLS）

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

/**
 * 获取 Supabase 服务端客户端单例
 *
 * 延迟初始化，首次调用时创建客户端，避免 build 时因缺少环境变量而报错。
 * 仅在 runtime 的 API 路由中调用。
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}
